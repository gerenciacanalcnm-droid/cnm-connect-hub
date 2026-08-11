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

          // Validación estricta del CRON_SECRET
          if (!cronSecret) {
            console.error('CRON_SECRET not configured in environment');
            return new Response('Configuration Error', { status: 500 });
          }

          if (!authHeader) {
            return new Response('Unauthorized: Missing token', { status: 401 });
          }

          const token = authHeader.replace('Bearer ', '');
          
          // timingSafeEqual requires buffers of the same length
          const tokenBuffer = Buffer.from(token);
          const secretBuffer = Buffer.from(cronSecret);

          if (tokenBuffer.length !== secretBuffer.length || !timingSafeEqual(tokenBuffer, secretBuffer)) {
            return new Response('Unauthorized: Invalid token', { status: 401 });
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
