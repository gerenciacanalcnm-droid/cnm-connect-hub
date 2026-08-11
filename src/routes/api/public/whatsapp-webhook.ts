import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { processAutomationTrigger } from '@/lib/automation-engine.server';
import { generateNovaResponse } from '@/lib/nova-engine.server';

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
              const newStatus = statusUpdate.status;
              const timestamp = statusUpdate.timestamp;
              
              const { data: msg } = await supabaseAdmin
                .from('whatsapp_messages')
                .select('id, status')
                .eq('external_id', remoteId)
                .maybeSingle();

              if (!msg) continue;

              const statusPriority: Record<string, number> = {
                'sending': 0, 'sent': 1, 'delivered': 2, 'read': 3, 'failed': 4
              };

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

              if (!account) continue;

              // Identificar o crear conversación y contacto
              const { data: contact } = await supabaseAdmin
                .from('contacts')
                .select('id')
                .eq('company_id', account.company_id)
                .eq('phone', from)
                .maybeSingle();
              
              if (!contact) continue; // Por simplicidad, asumimos contacto existente en CRM

              const { data: conv, error: convErr } = await supabaseAdmin
                .from('whatsapp_conversations')
                .select('id, status, assigned_to')
                .eq('company_id', account.company_id)
                .eq('contact_id', contact.id)
                .maybeSingle();
              
              let conversationId = conv?.id;
              if (!conversationId) {
                const { data: newConv } = await supabaseAdmin
                  .from('whatsapp_conversations')
                  .insert({
                    company_id: account.company_id,
                    contact_id: contact.id,
                    last_message: text,
                    status: 'SIN_ASIGNAR'
                  })
                  .select('id')
                  .single();
                conversationId = newConv?.id;
              } else {
                await supabaseAdmin
                  .from('whatsapp_conversations')
                  .update({ last_message: text, updated_at: new Date().toISOString() })
                  .eq('id', conversationId);
              }

              // Registrar mensaje entrante
              await supabaseAdmin.from('whatsapp_messages').insert({
                company_id: account.company_id,
                conversation_id: conversationId,
                contact_id: contact.id,
                body: text,
                direction: 'inbound',
                status: 'delivered',
                external_id: wamid
              });

              // Disparar automatizaciones estándar
              await processAutomationTrigger(
                account.company_id,
                'whatsapp_message',
                { phone: from, text: text, wamid, conversation_id: conversationId, contact_id: contact.id },
                wamid
              );

              // --- CICLO NOVA AI ---
              // Reglas: Nova Activo + Conversación NO asignada/Cerrada
              const { data: settings } = await supabaseAdmin
                .from('nova_settings' as any)
                .select('status')
                .eq('company_id', account.company_id)
                .maybeSingle();

              const isNovaActive = (settings as any)?.status === 'ACTIVO';
              const isAssigned = conv?.assigned_to != null;
              const isClosed = conv?.status === 'CERRADA';

              if (isNovaActive && !isAssigned && !isClosed) {
                try {
                  const novaResp = await generateNovaResponse(
                    account.company_id,
                    contact.id,
                    conversationId,
                    text
                  );

                  if (novaResp.response) {
                    // Cargar dinámicamente el servicio de envío que maneja Wallet
                    const { sendWhatsAppIndividual } = await import('@/lib/whatsapp.functions');
                    
                    // Ejecutar vía server function interna para asegurar cobro y RLS simulado vía admin
                    // Como el webhook es público, usamos una versión interna o llamamos directamente al servicio
                    await internalSendNovaResponse(
                      account.company_id,
                      account.id,
                      from,
                      novaResp.response,
                      conversationId,
                      contact.id
                    );
                  }
                } catch (novaErr) {
                  console.error('[Nova Engine Error]:', novaErr);
                  // Registrar error en logs pero no interrumpir el webhook
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

/**
 * Función interna para enviar la respuesta de Nova
 * Asegura: Wallet, Registro con etiqueta AI, Evitar loops
 */
async function internalSendNovaResponse(
  companyId: string,
  accountId: string,
  recipient: string,
  body: string,
  conversationId: string,
  contactId: string
) {
  const { trackServiceUsage } = await import('@/lib/commercial.functions');
  
  // 1. Registrar mensaje en estado 'sending' marcado como NOVA
  const { data: msg } = await supabaseAdmin
    .from('whatsapp_messages')
    .insert({
      company_id: companyId,
      conversation_id: conversationId,
      contact_id: contactId,
      body: body,
      direction: 'outbound',
      status: 'sending',
      metadata: { source: 'NOVA', account_id: accountId }
    })
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

    // 3. Obtener credenciales de cuenta
    const { data: account } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('phone_number_id, access_token')
      .eq('id', accountId)
      .single();

    if (!account) throw new Error("Cuenta no encontrada");

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
        status: 'sent',
        external_id: metaResult.messages?.[0]?.id,
        cost: usage.amount,
        metadata: { source: 'NOVA', ...metaResult } 
      })
      .eq('id', msg.id);

  } catch (err: any) {
    console.error('[Internal Nova Send Error]:', err.message);
    await supabaseAdmin
      .from('whatsapp_messages')
      .update({ 
        status: 'failed',
        metadata: { source: 'NOVA', error: err.message, failure_reason: err.message.includes('Saldo') ? 'insufficient_balance' : 'api_error' }
      })
      .eq('id', msg.id);
  }
}

