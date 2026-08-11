import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
import { reviewRecharge } from '@/lib/commercial.functions';

export const Route = createFileRoute('/api/public/webhooks/wompi')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const bodyText = await request.text();
          const payload = JSON.parse(bodyText);
          
          // 1. Validar firma de Wompi (Idempotencia y Autenticidad)
          const signature = request.headers.get('x-event-checksum');
          const secret = process.env['WOMPI_EVENT_SECRET'];

          if (secret && signature) {
            const data = payload.data.transaction;
            // El orden de los campos para la firma de eventos en Wompi es: 
            // evento + data.transaction.id + data.transaction.status + data.transaction.amount_in_cents + timestamp + secret
            const content = `${payload.event}${data.id}${data.status}${data.amount_in_cents}${payload.timestamp}${secret}`;
            const expectedSignature = createHmac('sha256', secret).update(content).digest('hex');
            
            if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
              console.warn('Wompi Webhook: Invalid signature');
              return new Response('Invalid signature', { status: 401 });
            }
          }

          // 2. Extraer datos
          const transaction = payload.data.transaction;
          const rechargeId = transaction.reference; 
          const status = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

          if (payload.event !== 'transaction.updated') {
            return new Response('Event not handled', { status: 200 });
          }

          // 3. Mapear estados y procesar
          // Usamos reviewRecharge que tiene lógica atómica e idempotente (por referencia)
          if (status === 'APPROVED') {
            await reviewRecharge({
              data: {
                id: rechargeId,
                review_status: 'aprobada',
                review_note: `Aprobado automáticamente por Wompi. Ref: ${transaction.id}`
              }
            });
          } else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') {
             await reviewRecharge({
              data: {
                id: rechargeId,
                review_status: 'rechazada',
                review_note: `Transacción ${status} en Wompi. Ref: ${transaction.id}`
              }
            });
          }

          return new Response('ok', { status: 200 });
        } catch (error: any) {
          console.error('Wompi Webhook Error:', error);
          return new Response(error.message, { status: 500 });
        }
      }
    }
  }
});
