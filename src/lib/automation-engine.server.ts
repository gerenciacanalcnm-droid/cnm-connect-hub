import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Motor de Ejecución de Automatizaciones E2E
 * Usamos tipado dinámico para evitar errores de compilación con tipos de Supabase desincronizados
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
    // Protección de Idempotencia: Verificar si ya se ejecutó para este evento
    const executionRef = `${automation.id}_${eventReference}`;
    const { data: existingLog } = await sb
      .from("automation_logs" as any)
      .select("id")
      .eq("execution_data->>reference" as any, executionRef)
      .maybeSingle();

    if (existingLog) continue;

    try {
      // 2. Evaluar Condiciones
      const conditionsMet = evaluateConditions(automation.conditions_config, triggerData);
      
      if (!conditionsMet) {
        await logAutomationExecution(sb, automation.id, companyId, triggerType, triggerData, "SKIPPED", { 
          reason: "Conditions not met",
          reference: executionRef 
        });
        continue;
      }

      // 3. Ejecutar Acciones
      for (const action of (automation.actions_config as any[])) {
        await executeAction(sb, automation, action, triggerData, companyId, executionRef);
      }

      // 4. Actualizar última ejecución
      await sb
        .from("automations" as any)
        .update({ last_executed_at: new Date().toISOString() } as any)
        .eq("id", automation.id);

    } catch (err: any) {
      await logAutomationExecution(sb, automation.id, companyId, triggerType, triggerData, "FAILED", { 
        error: err.message,
        reference: executionRef 
      });
    }
  }
}

function evaluateConditions(conditions: any, data: any): boolean {
  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;
  
  return (conditions as any[]).every(condition => {
    const { field, operator, value } = condition;
    const actualValue = data[field];

    switch (operator) {
      case "=": return String(actualValue) === String(value);
      case "!=": return String(actualValue) !== String(value);
      case "contains": return String(actualValue).includes(String(value));
      default: return true;
    }
  });
}

async function executeAction(
  sb: any,
  automation: any,
  action: any,
  triggerData: any,
  companyId: string,
  executionRef: string
) {
  const actionType = action.type;
  
  switch (actionType) {
    case "send_sms":
      await handleSmsAction(sb, automation, action, triggerData, companyId, executionRef);
      break;
    case "send_whatsapp":
      await handleWhatsAppAction(sb, automation, action, triggerData, companyId, executionRef);
      break;
    case "assign_agent":
      if (triggerData.conversation_id) {
        await sb.from("whatsapp_conversations" as any)
          .update({ assigned_to: action.agent_id, status: "ASIGNADA" } as any)
          .eq("id", triggerData.conversation_id);
      }
      break;
    case "add_tag":
      if (triggerData.contact_id) {
        const { data: contact } = await sb.from("contacts" as any).select("tags" as any).eq("id", triggerData.contact_id).single();
        const newTags = Array.from(new Set([...((contact as any)?.tags || []), action.tag]));
        await sb.from("contacts" as any).update({ tags: newTags } as any).eq("id", triggerData.contact_id);
      }
      break;
  }

  await logAutomationExecution(sb, automation.id, companyId, automation.trigger_config.type, triggerData, "SUCCESS", {
    action: actionType,
    reference: executionRef
  });
}

async function handleSmsAction(sb: any, automation: any, action: any, triggerData: any, companyId: string, executionRef: string) {
  const phone = triggerData.phone || action.phone;
  const body = action.body || "Mensaje automático";
  
  // Verificación básica de wallet para este sprint
  const { data: wallet } = await sb.from("wallets" as any).select("id, balance" as any).eq("company_id", companyId).eq("channel", "sms").maybeSingle();
  if (!wallet || (wallet as any).balance < 0) {
     throw new Error("INSUFFICIENT_BALANCE");
  }

  await sb.from("sms_messages" as any).insert({
    company_id: companyId,
    to_phone: phone,
    body: body,
    status: "sent",
    metadata: { automation_id: automation.id, reference: executionRef }
  } as any);
}

async function handleWhatsAppAction(sb: any, automation: any, action: any, triggerData: any, companyId: string, executionRef: string) {
  // Implementación similar a SMS
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
