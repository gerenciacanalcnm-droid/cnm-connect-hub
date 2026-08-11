import { applyWalletMovement } from "./commercial.functions";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Lógica interna de procesamiento de programaciones.
 * Ubicada en un archivo .server.ts para evitar transformaciones de TanStack Start
 * que requieran contexto de ejecución durante llamadas directas (como scripts).
 */
export async function executePendingSchedules(sb: any) {
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
      await applyWalletMovement(sb, {
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
