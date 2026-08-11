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
          // Buscamos si existe alguna cuenta con este verify_token
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
          
          // TODO: Implementar validación de firma X-Hub-Signature-256
          
          // Log temporal para depuración (según SPRINT 10 FASE 1, evitamos logs sensibles en prod)
          // console.log('WhatsApp Webhook Received:', JSON.stringify(payload));

          // Guardar el evento en la tabla de webhooks para procesamiento asíncrono posterior
          await supabaseAdmin.from('whatsapp_webhooks').insert({
            payload: payload,
            processed: false
          });

          return new Response('OK', { status: 200 });
        } catch (err) {
          return new Response('Error', { status: 500 });
        }
      }
    }
  }
});
