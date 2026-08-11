import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { trackServiceUsage } from "./commercial.functions";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

const scheduleStatus = z.enum(['PROGRAMADO', 'PROCESANDO', 'ENVIANDO', 'COMPLETADO', 'FALLIDO', 'CANCELADO']);

export const createSmsSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipients: z.array(z.string().min(10)),
      body: z.string().min(1),
      isFlash: z.boolean().default(false),
      scheduledAt: z.string(), // ISO string
      timezone: z.string().default('America/Bogota'),
      estimatedCost: z.number().nonnegative(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { recipients, body, isFlash, scheduledAt, timezone, estimatedCost } = data;
    
    const { data: row, error } = await context.supabase
      .from("sms_schedules")
      .insert({
        company_id: CNM_COMPANY_ID,
        user_id: context.userId,
        recipients,
        body,
        is_flash: isFlash,
        scheduled_at: scheduledAt,
        timezone,
        estimated_cost: estimatedCost,
        reference: crypto.randomUUID(),
        status: 'PROGRAMADO'
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const listSmsSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sms_schedules")
      .select("*")
      .order("scheduled_at", { ascending: false });

    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  });

export const cancelSmsSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: current, error: fetchErr } = await context.supabase
      .from("sms_schedules")
      .select("status")
      .eq("id", data.id)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);
    if (current.status !== 'PROGRAMADO') throw new Error("Solo se pueden cancelar envíos en estado PROGRAMADO");

    const { error } = await context.supabase
      .from("sms_schedules")
      .update({ status: 'CANCELADO' } as any)
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Función que simula la ejecución de las programaciones.
 * En un entorno real, esta sería llamada por un CRON cada minuto.
 */
export const processPendingSmsSchedules = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Buscar programaciones pendientes
    const { data: pending, error: fetchErr } = await supabaseAdmin
      .from("sms_schedules")
      .select("*")
      .eq("status", 'PROGRAMADO')
      .lte("scheduled_at", new Date().toISOString());

    if (fetchErr) {
      console.error("Error fetching pending schedules:", fetchErr);
      return { processed: 0 };
    }

    if (!pending || pending.length === 0) return { processed: 0 };

    for (const schedule of pending) {
      // 2. Marcar como procesando
      await supabaseAdmin.from("sms_schedules").update({ status: 'PROCESANDO' } as any).eq("id", schedule.id);

      try {
        // 3. Re-validar saldo y cobrar
        await trackServiceUsage({
          data: {
            company_id: schedule.company_id,
            channel: "sms",
            units: schedule.recipients.length,
            description: `Ejecución Programada SMS${schedule.is_flash ? ' FLASH' : ''}`,
            reference: schedule.reference,
            isFlash: schedule.is_flash,
          },
        });

        // 4. Marcar como enviando
        await supabaseAdmin.from("sms_schedules").update({ status: 'ENVIANDO' } as any).eq("id", schedule.id);

        // 5. Insertar en sms_messages (Ejecución real simulada)
        const recipients = schedule.recipients as string[];
        const chunks = [];
        for (let i = 0; i < recipients.length; i += 100) {
          chunks.push(recipients.slice(i, i + 100));
        }

        for (const chunk of chunks) {
          await supabaseAdmin.from("sms_messages").insert(
            chunk.map(to => ({
              company_id: schedule.company_id,
              to_phone: to,
              body: schedule.body,
              status: "sent",
              sent_at: new Date().toISOString(),
            } as any))
          );
        }

        // 6. Completado
        await supabaseAdmin.from("sms_schedules").update({ status: 'COMPLETADO' } as any).eq("id", schedule.id);

      } catch (err: any) {
        // 7. Fallido
        const reason = err.message === "Saldo insuficiente" ? "SALDO_INSUFICIENTE" : err.message;
        await supabaseAdmin.from("sms_schedules").update({ 
          status: 'FALLIDO',
          error_reason: reason
        } as any).eq("id", schedule.id);
      }
    }

    return { processed: pending.length };
  });
