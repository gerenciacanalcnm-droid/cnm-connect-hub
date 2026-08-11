import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

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
       * Meta Event Notifications (Status updates)
       */
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          
          // Auditoría del webhook bruto
          await supabaseAdmin.from('whatsapp_webhooks').insert({
            event_type: payload?.entry?.[0]?.changes?.[0]?.field || 'unknown',
            payload: payload
          });

          // Procesar actualizaciones de estado de mensajes
          const entry = payload.entry?.[0];
          const changes = entry?.changes?.[0];
          const value = changes?.value;
          const statuses = value?.statuses;

          if (statuses && Array.isArray(statuses)) {
            for (const statusUpdate of statuses) {
              const remoteId = statusUpdate.id; // wamid
              const newStatus = statusUpdate.status; // sent, delivered, read, failed
              const timestamp = statusUpdate.timestamp;
              
              // 1. Identificar mensaje por external_id (wamid)
              const { data: msg } = await supabaseAdmin
                .from('whatsapp_messages')
                .select('id, status')
                .eq('external_id', remoteId)
                .maybeSingle();

              if (!msg) continue;

              // 2. Mapeo de estados y validación de precedencia para evitar retrocesos
              const statusPriority: Record<string, number> = {
                'sending': 0,
                'sent': 1,
                'delivered': 2,
                'read': 3,
                'failed': 4
              };

              const currentPriority = statusPriority[msg.status] || 0;
              const newPriority = statusPriority[newStatus] || 0;

              // Si el nuevo estado es 'failed' o tiene mayor prioridad, actualizamos
              if (newStatus === 'failed' || newPriority > currentPriority) {
                const updateData: any = {
                  status: newStatus,
                  updated_at: new Date().toISOString()
                };

                if (newStatus === 'failed') {
                  const error = statusUpdate.errors?.[0];
                  updateData.error_code = error?.code?.toString();
                  // No hay columna metadata en whatsapp_messages, así que ignoramos el guardado de mensaje de error por ahora
                  // o podríamos concatenar al error_code si fuera necesario.
                }

                if (newStatus === 'delivered') updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString();
                if (newStatus === 'read') updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString();

                await supabaseAdmin
                  .from('whatsapp_messages')
                  .update(updateData)
                  .eq('id', msg.id);
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
