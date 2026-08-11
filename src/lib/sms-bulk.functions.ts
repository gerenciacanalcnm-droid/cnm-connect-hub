import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { trackServiceUsage } from "./commercial.functions";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Procesa el envío de una lista de destinatarios.
 * Realiza la validación de saldo para el total y luego procede con el envío (simulado).
 */
export const sendBulkSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipients: z.array(z.string().min(10)),
      body: z.string().min(1),
      isFlash: z.boolean().default(false),
      scheduledAt: z.string().optional().nullable(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { recipients, body, isFlash, scheduledAt } = data;
    const totalRecipients = recipients.length;
    
    if (totalRecipients === 0) throw new Error("No hay destinatarios válidos.");

    const batchId = crypto.randomUUID();

    // 1. Cobro atómico consolidado
    // Nota: trackServiceUsage maneja la lógica de saldo insuficiente y lanza error si falla.
    try {
      await trackServiceUsage({
        data: {
          company_id: CNM_COMPANY_ID,
          channel: "sms",
          units: totalRecipients,
          description: `Envío Masivo SMS${isFlash ? ' FLASH' : ''} (${totalRecipients} dest.)`,
          reference: batchId,
          isFlash: isFlash,
        },
      });
    } catch (err: any) {
      // Si falla el cobro, no insertamos nada y propagamos el error (Saldo insuficiente)
      throw err;
    }

    // 2. Registro de los mensajes (en batch)
    // En producción esto debería ir a una cola de BullMQ o similar.
    const chunks = [];
    for (let i = 0; i < recipients.length; i += 100) {
      chunks.push(recipients.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const { error } = await context.supabase.from("sms_messages").insert(
        chunk.map(to => ({
          company_id: CNM_COMPANY_ID,
          to_phone: to,
          body,
          status: (scheduledAt ? "queued" : "sent") as any,
          sent_at: scheduledAt ? null : new Date().toISOString(),
        } as any))
      );
      if (error) console.error("Error inserting bulk sms chunk:", error);
    }



    return { ok: true, batchId, total: totalRecipients };
  });
