import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { applyWalletMovement } from "./commercial.functions";
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
 * Lógica interna de procesamiento de programaciones.
 * Separada de la capa de IO de TanStack Start para ser llamada desde scripts/cron.
 */
export async function processPendingSmsSchedulesInternal(sb: any) {
  const now = new Date().toISOString();

  // 1. Buscar registros: PROGRAMADO y fecha/hora <= ahora
  const { data: pending, error } = await sb
    .from("sms_schedules")
    .select("*")
    .eq("status", "PROGRAMADO")
    .lte("scheduled_at", now);

  if (error) {
    console.error("[Scheduler] Error fetching pending schedules:", error.message);
    return { error: error.message };
  }
  
  if (!pending || pending.length === 0) {
    return { processed: 0, status: 'no_pending_tasks' };
  }

  let processedCount = 0;
  const results = [];

  for (const schedule of pending) {
    // 2. Proteccion contra duplicación: Intento atómico de cambio de estado a PROCESANDO
    const { data: lockAttempt, error: lockErr } = await sb
      .from("sms_schedules")
      .update({ status: 'PROCESANDO' } as any)
      .eq("id", schedule.id)
      .eq("status", "PROGRAMADO")
      .select();

    if (lockErr || !lockAttempt || lockAttempt.length === 0) {
      continue;
    }

    try {
      // 3. Revalidar saldo mediante el Motor Comercial existente
      // Implementamos la lógica de trackServiceUsage aquí para evitar depender de middleware de server functions
      const { data: tiers } = await sb
        .from("rate_tiers")
        .select("unit_price, from_qty, to_qty")
        .eq("channel", schedule.is_flash ? "sms_flash" : "sms")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const units = schedule.recipients.length;
      const tier = tiers?.find((t: any) => units >= (t.from_qty || 0) && (t.to_qty === 0 || units <= t.to_qty));
      
      if (!tier) throw new Error("Tarifa no disponible para el servicio.");

      const unitPrice = tier.unit_price;
      const finalAmount = unitPrice * units;

      const { data: wallet } = await sb
        .from("wallets")
        .select("id")
        .eq("company_id", schedule.company_id)
        .eq("channel", "sms")
        .maybeSingle();

      if (!wallet) throw new Error("No existe wallet para el canal SMS");

      // 4. Aplicar descuento mediante el Motor Comercial (atómico e idempotente)
      const chargeRes = await applyWalletMovement(sb, {
        walletId: wallet.id,
        amount: -Math.abs(finalAmount),
        units: -Math.abs(units),
        type: "AJUSTE_DEBITO",
        concept: `Ejecución programada: ${schedule.id}`,
        reference: schedule.reference,
        performedBy: schedule.user_id,
      });

      // 5. Marcar como COMPLETADO
      await sb
        .from("sms_schedules")
        .update({ 
          status: 'COMPLETADO',
          executed_at: new Date().toISOString(),
          actual_cost: finalAmount,
          recipients_sent: units,
          recipients_failed: 0,
        } as any)
        .eq("id", schedule.id);
      
      processedCount++;
      results.push({ id: schedule.id, status: 'COMPLETADO' });
    } catch (e: any) {
      console.error(`[Scheduler] Error processing schedule ${schedule.id}:`, e.message);
      
      const isInsufficient = e.message.includes("Saldo insuficiente");
      
      await sb
        .from("sms_schedules")
        .update({ 
          status: 'FALLIDO',
          error_log: isInsufficient ? "INSUFFICIENT_BALANCE" : e.message,
          actual_cost: 0,
          recipients_sent: 0,
          recipients_failed: schedule.recipients.length
        } as any)
        .eq("id", schedule.id);

      results.push({ id: schedule.id, status: 'FALLIDO', reason: isInsufficient ? "INSUFFICIENT_BALANCE" : e.message });
    }
  }

  return { 
    processed: processedCount, 
    total_found: pending.length,
    results 
  };
}

export const processPendingSmsSchedules = createServerFn({ method: "POST" })
  .handler(async () => {
    return processPendingSmsSchedulesInternal(supabaseAdmin);
  });
