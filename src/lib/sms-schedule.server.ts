import { applyWalletMovement } from "./commercial.functions";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Lógica interna de procesamiento de programaciones (SMS y WhatsApp).
 * Ubicada en un archivo .server.ts para evitar transformaciones de TanStack Start.
 */
export async function executePendingSchedules(sb: any) {
  const now = new Date().toISOString();

  // 1. Procesar SMS
  const smsResult = await processSmsSchedules(sb, now);

  // 2. Procesar WhatsApp
  const waResult = await processWhatsAppSchedules(sb, now);

  return { 
    sms: smsResult,
    whatsapp: waResult,
    processed: (smsResult.processed || 0) + (waResult.processed || 0)
  };
}

async function processSmsSchedules(sb: any, now: string) {
  const { data: pending, error } = await sb
    .from("sms_schedules")
    .select("*")
    .eq("status", "PROGRAMADO")
    .lte("scheduled_at", now);

  if (error) {
    console.error("[Scheduler:SMS] Error fetching pending schedules:", error.message);
    return { error: error.message };
  }
  
  if (!pending || pending.length === 0) return { processed: 0 };

  let processedCount = 0;
  for (const schedule of pending) {
    const { data: lockAttempt } = await sb
      .from("sms_schedules")
      .update({ status: 'PROCESANDO' } as any)
      .eq("id", schedule.id)
      .eq("status", "PROGRAMADO")
      .select();

    if (!lockAttempt || lockAttempt.length === 0) continue;

    try {
      // Revalidar tarifa y saldo
      const { data: tiers } = await sb
        .from("rate_tiers")
        .select("unit_price, from_qty, to_qty")
        .eq("channel", schedule.is_flash ? "sms_flash" : "sms")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const units = schedule.recipients.length;
      const tier = tiers?.find((t: any) => units >= (t.from_qty || 0) && (t.to_qty === 0 || units <= t.to_qty));
      if (!tier) throw new Error("Tarifa no disponible");

      const finalAmount = tier.unit_price * units;

      const { data: wallet } = await sb
        .from("wallets")
        .select("id")
        .eq("company_id", schedule.company_id)
        .eq("channel", "sms")
        .maybeSingle();

      if (!wallet) throw new Error("No existe wallet SMS");

      await applyWalletMovement(sb, {
        walletId: wallet.id,
        amount: -Math.abs(finalAmount),
        units: -Math.abs(units),
        type: "AJUSTE_DEBITO",
        concept: `Ejecución programada SMS: ${schedule.id}`,
        reference: schedule.reference,
        performedBy: schedule.user_id,
      });

      // Simular envío (en prod real se llamaría al proveedor)
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
    } catch (e: any) {
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
    }
  }
  return { processed: processedCount, total: pending.length };
}

async function processWhatsAppSchedules(sb: any, now: string) {
  const { data: pending, error } = await sb
    .from("wa_schedules")
    .select("*, whatsapp_accounts(phone_number_id, access_token), whatsapp_templates(*)")
    .eq("status", "PROGRAMADO")
    .lte("scheduled_at", now);

  if (error) {
    console.error("[Scheduler:WA] Error fetching pending schedules:", error.message);
    return { error: error.message };
  }
  
  if (!pending || pending.length === 0) return { processed: 0 };

  let processedCount = 0;
  for (const schedule of pending) {
    const { data: lockAttempt } = await sb
      .from("wa_schedules")
      .update({ status: 'PROCESANDO' } as any)
      .eq("id", schedule.id)
      .eq("status", "PROGRAMADO")
      .select();

    if (!lockAttempt || lockAttempt.length === 0) continue;

    try {
      // 1. Revalidar Tarifa WhatsApp
      const { data: tiers } = await sb
        .from("rate_tiers")
        .select("unit_price, from_qty, to_qty")
        .eq("channel", "whatsapp")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const units = schedule.recipients.length;
      const tier = tiers?.find((t: any) => units >= (t.from_qty || 0) && (t.to_qty === 0 || units <= t.to_qty));
      if (!tier) throw new Error("Tarifa WhatsApp no disponible");

      const finalAmount = tier.unit_price * units;

      const { data: wallet } = await sb
        .from("wallets")
        .select("id")
        .eq("company_id", schedule.company_id)
        .eq("channel", "whatsapp")
        .maybeSingle();

      if (!wallet) throw new Error("No existe wallet WhatsApp");

      // 2. Cobro atómico
      await applyWalletMovement(sb, {
        walletId: wallet.id,
        amount: -Math.abs(finalAmount),
        units: -Math.abs(units),
        type: "AJUSTE_DEBITO",
        concept: `Ejecución programada WA: ${schedule.id}`,
        reference: schedule.reference,
        performedBy: schedule.user_id,
      });

      // 3. Envío a Meta Cloud API
      const account = schedule.whatsapp_accounts;
      if (!account) throw new Error("Cuenta de WhatsApp no vinculada");

      const results = { sent: 0, failed: 0 };
      
      for (const to of schedule.recipients) {
        try {
          const toFormatted = to.startsWith("57") ? to : `57${to}`;
          let payload: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: toFormatted,
          };

          if (schedule.template_id && schedule.whatsapp_templates) {
            const template = schedule.whatsapp_templates;
            const vars = schedule.variables || {};
            const parameters = Object.keys(vars).sort((a, b) => parseInt(a) - parseInt(b)).map(key => ({
              type: "text",
              text: vars[key]
            }));

            payload.type = "template";
            payload.template = {
              name: template.name,
              language: { code: template.language },
              components: parameters.length > 0 ? [{
                type: "body",
                parameters
              }] : []
            };
          } else {
            payload.type = "text";
            payload.text = { body: schedule.message_body };
          }

          const metaResponse = await fetch(
            `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${account.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          const metaResult = await metaResponse.json();
          const isOk = metaResponse.ok;

          // Registrar mensaje individual para seguimiento de estados (webhook)
          await sb.from("whatsapp_messages").insert({
            company_id: schedule.company_id,
            account_id: schedule.account_id,
            to_phone: to,
            body: schedule.message_body || schedule.whatsapp_templates?.body,
            template_id: schedule.template_id,
            direction: "outbound",
            status: isOk ? "sent" : "failed",
            metadata: { 
              schedule_id: schedule.id, 
              external_id: metaResult.messages?.[0]?.id,
              ...metaResult 
            },
            cost: 0, // Ya cobrado en el total de la programación
            external_id: metaResult.messages?.[0]?.id
          } as any);

          if (isOk) results.sent++; else results.failed++;
        } catch (innerErr) {
          results.failed++;
        }
      }

      // 4. Marcar Programación como COMPLETADA
      await sb
        .from("wa_schedules")
        .update({ 
          status: 'COMPLETADO',
          actual_cost: finalAmount,
        } as any)
        .eq("id", schedule.id);
      
      processedCount++;
    } catch (e: any) {
      const isInsufficient = e.message.includes("Saldo insuficiente");
      await sb
        .from("wa_schedules")
        .update({ 
          status: 'FALLIDO',
          error_log: isInsufficient ? "INSUFFICIENT_BALANCE" : e.message,
          actual_cost: 0,
        } as any)
        .eq("id", schedule.id);
    }
  }
  return { processed: processedCount, total: pending.length };
}
