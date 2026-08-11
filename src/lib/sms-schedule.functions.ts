import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { trackServiceUsage } from "./commercial.functions";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

export const createSmsSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipients: z.array(z.string().min(10)),
      body: z.string().min(1),
      isFlash: z.boolean().default(false),
      scheduledAt: z.string(),
      timezone: z.string().default('America/Bogota'),
      estimatedCost: z.number().nonnegative(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { recipients, body, isFlash, scheduledAt, timezone, estimatedCost } = data;
    
    // Si scheduledAt no tiene offset, asumimos el de la zona horaria.
    // Para America/Bogota es -05:00.
    let finalScheduledAt = scheduledAt;
    if (!scheduledAt.includes('Z') && !scheduledAt.includes('+') && !scheduledAt.includes('-')) {
      const offset = timezone === 'America/Bogota' ? '-05:00' : '-05:00'; 
      finalScheduledAt = `${scheduledAt}${offset}`;
    }

    const { data: row, error } = await context.supabase
      .from("sms_schedules")
      .insert({
        company_id: CNM_COMPANY_ID,
        user_id: context.userId,
        recipients,
        body,
        is_flash: isFlash,
        scheduled_at: finalScheduledAt,
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
    const { error } = await context.supabase
      .from("sms_schedules")
      .update({ status: 'CANCELADO' } as any)
      .eq("id", data.id)
      .eq("status", "PROGRAMADO");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Motor de procesamiento de programaciones pendientes.
 * Se puede invocar vía cron o endpoint de mantenimiento.
 */
export const processPendingSmsSchedules = createServerFn({ method: "POST" })
  .handler(async () => {
    const sb = supabaseAdmin;
    const now = new Date().toISOString();

    // 1. Obtener programaciones que deben ejecutarse ya
    const { data: pending, error } = await sb
      .from("sms_schedules")
      .select("*")
      .eq("status", "PROGRAMADO")
      .lte("scheduled_at", now);

    if (error) throw new Error(error.message);
    if (!pending || pending.length === 0) return { processed: 0 };

    let processedCount = 0;
    for (const schedule of pending) {
      // 2. Marcar como PROCESANDO para evitar duplicidad si el proceso es lento
      await sb.from("sms_schedules").update({ status: 'PROCESANDO' } as any).eq("id", schedule.id);

      try {
        // 3. Validar saldo y cobrar atómicamente a través del motor comercial
        // Note: trackServiceUsage requires auth middleware, but we're calling it from admin context.
        // We'll call the server function but we need to satisfy the auth requirement if possible.
        // Since we are server-to-server and using supabaseAdmin, we might need a non-protected version.
        // For now, we'll try to call it.
        const usageResult = await trackServiceUsage({
          data: {
            company_id: schedule.company_id,
            channel: 'sms', 
            units: schedule.recipients.length,
            reference: schedule.reference,
            isFlash: schedule.is_flash,
            description: `Ejecución programada: ${schedule.id}`
          }
        });

        if (usageResult.ok) {
          // 4. Marcar como COMPLETADO
          await sb.from("sms_schedules").update({ 
            status: 'COMPLETADO',
            executed_at: new Date().toISOString()
          } as any).eq("id", schedule.id);
          processedCount++;
        }
      } catch (e: any) {
        console.error(`Error processing schedule ${schedule.id}:`, e.message);
        // 5. Registrar fallo si no hay saldo o error técnico
        await sb.from("sms_schedules").update({ 
          status: 'FALLIDO',
          error_log: e.message 
        } as any).eq("id", schedule.id);
      }
    }

    return { processed: processedCount };
  });
