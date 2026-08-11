import { createFileRoute } from '@tanstack/react-router';
import { executePendingSchedules } from '@/lib/sms-schedule.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

import { timingSafeEqual } from 'crypto';

export const Route = createFileRoute('/api/public/sms-scheduler')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get('Authorization');
          const cronSecret = process.env['CRON_SECRET'];

          // Si el secreto está configurado, validamos por seguridad
          if (cronSecret && authHeader) {
            const token = authHeader.replace('Bearer ', '');
            if (!timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))) {
              return new Response('Unauthorized', { status: 401 });
            }
          } else if (cronSecret && !authHeader) {
            // Si el secreto está en env pero no viene en el header, bloqueamos
            return new Response('Unauthorized', { status: 401 });
          }

          // Ejecución del motor de procesamiento
          // Note: createServerFn invocation returns a promise when called server-side
          const result = await executePendingSchedules(supabaseAdmin);
          
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error: any) {
          console.error('SMS Scheduler Error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});
