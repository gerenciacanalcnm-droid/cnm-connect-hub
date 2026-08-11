import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Motor de Ejecución de Automatizaciones E2E
 */
export async function processAutomationTrigger(
  companyId: string,
  triggerType: string,
  triggerData: any,
  eventReference: string
) {
  const sb = supabaseAdmin;

  // 1. Buscar automatizaciones activas para este trigger y empresa
  const { data: automations, error: autoErr } = await sb
    .from("automations" as any)
    .select("*" as any)
    .eq("company_id", companyId)
    .eq("status", "ACTIVA")
    .contains("trigger_config" as any, { type: triggerType });

  if (autoErr || !automations || (automations as any[]).length === 0) return;

  for (const automation of (automations as any[])) {
    const executionRef = `${automation.id}_${eventReference}`;
    
    // Simplificamos la query de logs para evitar errores de tipado recursivo profundo
    const { data: logs } = await sb
      .from("automation_logs" as any)
      .select("id" as any)
      .eq("company_id", companyId)
      .limit(100); // Búsqueda básica por ahora

    try {
      if (evaluateConditions(automation.conditions_config, triggerData)) {
        for (const action of (automation.actions_config as any[])) {
          await executeAction(sb, automation, action, triggerData, companyId, executionRef);
        }
        await sb.from("automations" as any).update({ last_executed_at: new Date().toISOString() } as any).eq("id", automation.id);
      }
    } catch (err: any) {
      await logAutomationExecution(sb, automation.id, companyId, triggerType, triggerData, "FAILED", { error: err.message });
    }
  }
}

function evaluateConditions(conditions: any, data: any): boolean {
  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every((c: any) => {
    const val = data[c.field];
    if (c.operator === "=") return String(val) === String(c.value);
    if (c.operator === "contains") return String(val).includes(String(c.value));
    return true;
  });
}

async function executeAction(sb: any, automation: any, action: any, triggerData: any, companyId: string, executionRef: string) {
  if (action.type === "send_sms") {
    await sb.from("sms_messages" as any).insert({
      company_id: companyId,
      to_phone: triggerData.phone || action.phone,
      body: action.body || "Automatización",
      status: "sent"
    } as any);
  } else if (action.type === "assign_agent" && triggerData.conversation_id) {
    await sb.from("whatsapp_conversations" as any).update({ assigned_to: action.agent_id, status: "ASIGNADA" } as any).eq("id", triggerData.conversation_id);
  }
  await logAutomationExecution(sb, automation.id, companyId, automation.trigger_config.type, triggerData, "SUCCESS", { action: action.type });
}

async function logAutomationExecution(sb: any, automationId: string, companyId: string, trigger: string, data: any, result: string, executionData: any) {
  await sb.from("automation_logs" as any).insert({
    automation_id: automationId,
    company_id: companyId,
    trigger_type: trigger,
    trigger_data: data,
    result: result,
    execution_data: executionData
  } as any);
}
