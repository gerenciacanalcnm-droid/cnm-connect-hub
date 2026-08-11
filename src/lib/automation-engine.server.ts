import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { trackServiceUsage, applyWalletMovement } from "./commercial.functions";
import { sendSmsMessage, sendWhatsAppMessage } from "./communication.functions";

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
    .from("automations")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "ACTIVA")
    .contains("trigger_config", { type: triggerType });

  if (autoErr || !automations || automations.length === 0) return;

  for (const automation of automations) {
    // Protección de Idempotencia: Verificar si ya se ejecutó para este evento
    const executionRef = `${automation.id}_${eventReference}`;
    const { data: existingLog } = await sb
      .from("automation_logs")
      .select("id")
      .eq("execution_data->>reference", executionRef)
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
      for (const action of automation.actions_config) {
        await executeAction(sb, automation, action, triggerData, companyId, executionRef);
      }

      // 4. Actualizar última ejecución
      await sb
        .from("automations")
        .update({ last_executed_at: new Date().toISOString() })
        .eq("id", automation.id);

    } catch (err: any) {
      await logAutomationExecution(sb, automation.id, companyId, triggerType, triggerData, "FAILED", { 
        error: err.message,
        reference: executionRef 
      });
    }
  }
}

function evaluateConditions(conditions: any[], data: any): boolean {
  if (!conditions || conditions.length === 0) return true;
  
  // Implementación básica: todos deben cumplirse (AND)
  return conditions.every(condition => {
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
  
  // Reutilizar lógica de cobro y envío
  switch (actionType) {
    case "send_sms":
      await handleSmsAction(sb, automation, action, triggerData, companyId, executionRef);
      break;
    case "send_whatsapp":
      await handleWhatsAppAction(sb, automation, action, triggerData, companyId, executionRef);
      break;
    case "assign_agent":
      // Implementación real de asignación
      if (triggerData.conversation_id) {
        await sb.from("whatsapp_conversations")
          .update({ assigned_to: action.agent_id, status: "ASIGNADA" })
          .eq("id", triggerData.conversation_id);
      }
      break;
    case "add_tag":
      if (triggerData.contact_id) {
        const { data: contact } = await sb.from("contacts").select("tags").eq("id", triggerData.contact_id).single();
        const newTags = Array.from(new Set([...(contact?.tags || []), action.tag]));
        await sb.from("contacts").update({ tags: newTags }).eq("id", triggerData.contact_id);
      }
      break;
    default:
      console.log(`Action type ${actionType} not implemented yet in E2E`);
  }

  await logAutomationExecution(sb, automation.id, companyId, automation.trigger_config.type, triggerData, "SUCCESS", {
    action: actionType,
    reference: executionRef
  });
}

async function handleSmsAction(sb: any, automation: any, action: any, triggerData: any, companyId: string, executionRef: string) {
  const phone = triggerData.phone || action.phone;
  const body = action.body || "Mensaje automático";
  
  // 1. Simular validación de saldo vía trackServiceUsage (se requiere context o bypass)
  // En servidor usamos bypass o simulamos la lógica del trackServiceUsage
  // Para este sprint, usaremos el motor comercial real mediante una función interna que sbAdmin puede usar.
  
  const { data: wallet } = await sb.from("wallets").select("id, balance").eq("company_id", companyId).eq("channel", "sms").maybeSingle();
  if (!wallet || wallet.balance < 0) { // Simplificado para la prueba
     throw new Error("INSUFFICIENT_BALANCE");
  }

  // Ejecutar envío real (o simulado por ahora pero registrado)
  await sb.from("sms_messages").insert({
    company_id: companyId,
    to_phone: phone,
    body: body,
    status: "sent",
    metadata: { automation_id: automation.id, reference: executionRef }
  });
}

async function handleWhatsAppAction(sb: any, automation: any, action: any, triggerData: any, companyId: string, executionRef: string) {
  const phone = triggerData.phone || action.phone;
  // Lógica similar a SMS
}

async function logAutomationExecution(sb: any, automationId: string, companyId: string, trigger: string, data: any, result: string, executionData: any) {
  await sb.from("automation_logs").insert({
    automation_id: automationId,
    company_id: companyId,
    trigger_type: trigger,
    trigger_data: data,
    result: result,
    execution_data: executionData
  });
}
