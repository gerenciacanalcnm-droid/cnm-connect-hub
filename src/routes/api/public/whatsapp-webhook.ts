import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { processAutomationTrigger } from '@/lib/automation-engine.server';
import { generateNovaResponse } from '@/lib/nova-engine.server';
import { Database } from '@/integrations/supabase/types';

type MessageStatus = Database['public']['Enums']['message_status'];

export const Route = createFileRoute('/api/public/whatsapp-webhook')({
  server: {
    handlers: {
      /**
       * Meta Webhook Verification (Hub Challenge)
       */
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token) {
          const { data, error } = await supabaseAdmin
            .from('whatsapp_accounts')
            .select('id')
            .eq('webhook_verify_token', token)
            .maybeSingle();

          if (data && !error) {
            return new Response(challenge, { status: 200 });
          }
        }

        return new Response('Forbidden', { status: 403 });
      },

      /**
       * Meta Event Notifications
       */
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          
          // Auditoría del webhook bruto
          await supabaseAdmin.from('whatsapp_webhooks').insert({
            event_type: payload?.entry?.[0]?.changes?.[0]?.field || 'unknown',
            payload: payload
          });

          const entry = payload.entry?.[0];
          const changes = entry?.changes?.[0];
          const value = changes?.value;
          const statuses = value?.statuses;

          // 1. Procesar actualizaciones de estado
          if (statuses && Array.isArray(statuses)) {
            for (const statusUpdate of statuses) {
              const remoteId = statusUpdate.id;
              const newStatus = statusUpdate.status as MessageStatus;
              const timestamp = statusUpdate.timestamp;
              
              // Map Meta status to our Priority system to prevent regressions
              const statusPriority: Record<string, number> = {
                'sent': 1,
                'delivered': 2,
                'read': 3,
                'failed': 4
              };

              // 1. Update Campaign Results (Massive)
              const { data: campaignResult } = await supabaseAdmin
                .from('whatsapp_campaign_results')
                .select('id, status, wamid')
                .eq('wamid', remoteId)
                .maybeSingle();

              if (campaignResult) {
                const currentPriority = statusPriority[campaignResult.status.toLowerCase()] || 0;
                const newPriority = statusPriority[newStatus.toLowerCase()] || 0;

                // Only update if priority increases or if it's a failure
                if (newStatus === 'failed' || newPriority > currentPriority) {
                  await supabaseAdmin
                    .from('whatsapp_campaign_results')
                    .update({ 
                      status: newStatus.toLowerCase() as any,
                      updated_at: new Date().toISOString()
                    } as any)
                    .eq('id', campaignResult.id);
                }
              }

              // 2. Update Individual Messages
              const { data: msg } = await supabaseAdmin
                .from('whatsapp_messages')
                .select('id, status')
                .eq('external_id', remoteId)
                .maybeSingle();

              if (msg) {
                const currentPriority = statusPriority[msg.status] || 0;
                const newPriority = statusPriority[newStatus] || 0;

                if (newStatus === 'failed' || newPriority > currentPriority) {
                  const updateData: any = {
                    status: newStatus,
                    updated_at: new Date().toISOString()
                  };

                  if (newStatus === 'failed') {
                    const error = statusUpdate.errors?.[0];
                    updateData.error_code = error?.code?.toString();
                  }

                  if (newStatus === 'delivered') updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString();
                  if (newStatus === 'read') updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString();

                  await supabaseAdmin.from('whatsapp_messages').update(updateData).eq('id', msg.id);
                }
              }
            }
          }

          // 2. Procesar mensajes entrantes
          const messages = value?.messages;
          if (messages && Array.isArray(messages)) {
            for (const message of messages) {
              const from = message.from;
              const text = message.text?.body;
              const wamid = message.id;

              // Identificar empresa por phone_number_id
              const { data: account } = await supabaseAdmin
                .from('whatsapp_accounts')
                .select('id, company_id, access_token, phone_number_id')
                .eq('phone_number_id', value.metadata?.phone_number_id)
                .maybeSingle();

              if (!account || !account.company_id) continue;

              const companyId = account.company_id as string;

              const { normalizeWhatsAppPhone } = await import('@/lib/whatsapp-contacts.functions');
              const normalizedPhone = normalizeWhatsAppPhone(from);

              // 2. Identificar o crear contacto por normalized_phone (Identidad Central)
              let { data: contact } = await supabaseAdmin
                .from('contacts')
                .select('id')
                .eq('company_id', companyId)
                .eq('normalized_phone', normalizedPhone)
                .maybeSingle();
              
              if (!contact) {
                const { data: newContact } = await supabaseAdmin
                  .from('contacts')
                  .insert({
                    company_id: companyId,
                    phone: from,
                    normalized_phone: normalizedPhone,
                    whatsapp_phone: normalizedPhone,
                    status: 'active',
                    preferred_channel: 'whatsapp'
                  })
                  .select('id')
                  .single();
                contact = newContact;
              }

              if (!contact) continue;

              // 3. Identificar o crear conversación (Aislada por cuenta/número)
              const { data: conv } = await supabaseAdmin
                .from('whatsapp_conversations')
                .select('id, status, assigned_to, unread_count')
                .eq('company_id', companyId)
                .eq('account_id', account.id) // Aislamiento por número
                .eq('contact_id', contact.id)
                .maybeSingle();
              
              let conversationId = conv?.id;
              if (!conversationId) {
                const { data: newConv } = await supabaseAdmin
                  .from('whatsapp_conversations')
                  .insert({
                    company_id: companyId,
                    account_id: account.id,
                    contact_id: contact.id,
                    contact_phone: from,
                    last_message_preview: text || '[Mensaje]',
                    last_message_at: new Date().toISOString(),
                    status: 'open',
                    channel: 'whatsapp',
                    unread_count: 1
                  })
                  .select('id')
                  .single();
                conversationId = newConv?.id;
              } else {
                await supabaseAdmin
                  .from('whatsapp_conversations')
                  .update({ 
                    last_message_preview: text || '[Mensaje]', 
                    last_message_at: new Date().toISOString(),
                    unread_count: (conv?.unread_count || 0) + 1,
                    updated_at: new Date().toISOString() 
                  })
                  .eq('id', conversationId);
              }

              if (!conversationId) continue;

              // Registrar mensaje entrante
              const { data: inboundMsgRow, error: inboundErr } = await (supabaseAdmin.from('whatsapp_messages') as any).insert({
                company_id: account.company_id,
                conversation_id: conversationId,
                to_phone: from,
                body: text || (message.interactive?.list_reply?.title || '[Interactivo]'),
                direction: 'inbound',
                status: 'delivered',
                external_id: wamid,
                metadata: message.interactive ? { interactive: message.interactive } : {}
              }).select('id').single();

              const inboundMsgId = (inboundMsgRow as any)?.id;

              // --- PROCESAR RESPUESTA A ENCUESTA ---
              if (message.type === 'interactive' && (message.interactive?.list_reply || message.interactive?.button_reply)) {
                const reply = message.interactive.list_reply || message.interactive.button_reply;
                const optionKey = reply.id; // Ejemplo: option_1

                // 1. Buscar encuesta asociada al último mensaje saliente de esta conversación
                const { data: lastOutbound } = await (supabaseAdmin
                  .from('whatsapp_messages') as any)
                  .select('*')
                  .eq('conversation_id', conversationId)
                  .eq('direction', 'outbound')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                
                const surveyId = (lastOutbound as any)?.metadata?.survey_id;

                if (surveyId) {
                  // 2. Buscar la opción por key
                  const { data: optionRow } = await (supabaseAdmin
                    .from('whatsapp_survey_options' as any) as any)
                    .select('id')
                    .eq('survey_id', surveyId)
                    .eq('option_key', optionKey)
                    .maybeSingle();
                  
                  const optionId = (optionRow as any)?.id;
                  
                  if (optionId) {
                    // 3. Registrar respuesta
                    await (supabaseAdmin.from('whatsapp_survey_responses' as any) as any).insert({
                      company_id: account.company_id,
                      survey_id: surveyId,
                      option_id: optionId,
                      contact_id: contact.id,
                      conversation_id: conversationId,
                      whatsapp_message_id: inboundMsgId
                    });

                    // 4. Disparar automatización de respuesta
                    await processAutomationTrigger(
                      companyId,
                      'SURVEY_RESPONSE',
                      { 
                        phone: from, 
                        survey_id: surveyId, 
                        option_key: optionKey,
                        option_label: reply.title,
                        conversation_id: conversationId, 
                        contact_id: contact.id 
                      },
                      wamid
                    );
                  }
                }
              }

              // Disparar automatizaciones estándar
              await processAutomationTrigger(
                companyId,
                'whatsapp_message',
                { phone: from, text: text, wamid, conversation_id: conversationId, contact_id: contact.id },
                wamid
              );

              // --- CICLO NOVA AI & CONVERSATION MAPS ---
              const { data: settingsData } = await supabaseAdmin
                .from('nova_settings' as any)
                .select('status')
                .eq('company_id', companyId)
                .maybeSingle();

              const isNovaActive = (settingsData as any)?.status === 'ACTIVO';
              const isAssigned = conv?.assigned_to != null;
              const isClosed = conv?.status === 'closed';

              if (isNovaActive && !isAssigned && !isClosed) {
                try {
                  // 1. Buscar Mapa Activo
                  const { data: activeMap } = await (supabaseAdmin.from as any)('conversation_maps')
                    .select('*')
                    .eq('company_id', companyId)
                    .eq('status', 'ACTIVO')
                    .limit(1)
                    .maybeSingle();


                  let responseText = null;

                  if (activeMap) {
                    // Ejecutar motor de mapa (simplificado para fase 4)
                    const { executeConversationMap } = await import('@/lib/nova-engine.server');
                    const mapResult = await executeConversationMap(
                      companyId,
                      contact.id,
                      conversationId,
                      text,
                      activeMap as any
                    );
                    responseText = mapResult.response;
                  } else {
                    // Si no hay mapa, comportamiento estándar de Nova
                    const novaResp = await generateNovaResponse(
                      companyId,
                      contact.id,
                      conversationId,
                      text
                    );
                    responseText = novaResp.response;
                  }

                  if (responseText) {
                    await internalSendNovaResponse(
                      companyId,
                      account.id,
                      from,
                      responseText,
                      conversationId,
                      contact.id
                    );
                  }
                } catch (novaErr) {
                  console.error('[Nova Engine Error]:', novaErr);
                }
              }

            }
          }

          return new Response('OK', { status: 200 });
        } catch (err) {
          console.error('[WhatsApp Webhook Error]:', err);
          return new Response('Error', { status: 500 });
        }
      }
    }
  }
});

async function internalSendNovaResponse(
  companyId: string,
  accountId: string,
  recipient: string,
  body: string,
  conversationId: string,
  contactId: string
) {
  const { trackServiceUsage } = await import('@/lib/commercial.functions');
  
  // 1. Registrar mensaje en estado 'sending'
  const { data: msg } = await supabaseAdmin
    .from('whatsapp_messages')
    .insert({
      company_id: companyId,
      conversation_id: conversationId,
      to_phone: recipient,
      body: body,
      direction: 'outbound',
      status: 'sending' as MessageStatus
    } as any)
    .select('id')
    .single();

  if (!msg) return;

  try {
    // 2. Validar Wallet
    const usage = await trackServiceUsage({
      data: {
        company_id: companyId,
        channel: 'whatsapp',
        units: 1,
        description: `Nova AI Response a ${recipient}`,
        reference: msg.id,
        messageType: 'nova_ai'
      }
    });

    // 3. Obtener credenciales
    const { data: account } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('phone_number_id, access_token')
      .eq('id', accountId)
      .single();

    if (!account || !account.access_token || !account.phone_number_id) {
      throw new Error("Cuenta incompleta");
    }

    // 4. Envío real a Meta
    const metaResponse = await fetch(
      `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { body: body },
        }),
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      throw new Error(metaResult.error?.message || "Error Meta");
    }

    // 5. Actualizar a SENT
    await supabaseAdmin
      .from('whatsapp_messages')
      .update({ 
        status: 'sent' as MessageStatus,
        external_id: metaResult.messages?.[0]?.id,
        cost: usage.amount
      } as any)
      .eq('id', msg.id);

  } catch (err: any) {
    console.error('[Internal Nova Send Error]:', err.message);
    await supabaseAdmin
      .from('whatsapp_messages')
      .update({ 
        status: 'failed' as MessageStatus,
        error_code: err.message.includes('Saldo') ? 'insufficient_balance' : 'api_error'
      } as any)
      .eq('id', msg.id);
  }
}
