import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { OpenAI } from "openai";

/**
 * Motor Nova AI - Cerebro de Respuestas Inteligentes
 */
export async function generateNovaResponse(
  companyId: string,
  contactId: string,
  conversationId: string,
  userMessage: string
) {
  const sb = supabaseAdmin;

  // 1. Obtener configuración de Nova
  const { data: settingsData, error: sErr } = await sb
    .from("nova_settings" as any)
    .select("*" as any)
    .eq("company_id", companyId)
    .maybeSingle();
  
  const settings = settingsData as any;
  if (sErr || !settings || settings.status !== "ACTIVO") {
    throw new Error("Nova no está activo para esta empresa.");
  }

  // 2. Obtener conocimiento de la empresa
  const { data: knowledge } = await sb
    .from("nova_knowledge" as any)
    .select("*" as any)
    .eq("company_id", companyId)
    .maybeSingle();

  // 3. Obtener contexto del contacto
  const { data: contactData } = await sb
    .from("contacts" as any)
    .select("*" as any)
    .eq("id", contactId)
    .single();

  const contact = contactData as any;

  // 4. Obtener historial reciente de WhatsApp (últimos 10 mensajes)
  const { data: historyData } = await sb
    .from("whatsapp_messages" as any)
    .select("*" as any)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(10);

  const history = (historyData ?? []) as any[];

  // 5. Construir System Prompt
  const systemPrompt = `
Eres ${settings.name || "Nova"}, un asistente inteligente corporativo.
Identidad: ${settings.personality || "Profesional y eficiente"}.
Instrucciones: ${settings.instructions || "Ayuda al cliente con sus dudas"}.

Información de la empresa:
${JSON.stringify(knowledge || {}, null, 2)}

Contexto del cliente:
Nombre: ${contact?.first_name || "Cliente"} ${contact?.last_name || ""}
Teléfono: ${contact?.phone || ""}
Etiquetas: ${JSON.stringify(contact?.tags || [])}

Responde de forma natural y concisa.
  `.trim();

  // 6. Preparar OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada en el servidor.");

  const openai = new OpenAI({ apiKey });
  
  const messages: any[] = [{ role: "system", content: systemPrompt }];
  
  // Agregar historial (reverso para orden cronológico)
  const sortedHistory = [...history].reverse();
  for (const msg of sortedHistory) {
    messages.push({
      role: msg.direction === "inbound" ? "user" : "assistant",
      content: msg.body
    });
  }
  
  // Agregar mensaje actual
  messages.push({ role: "user", content: userMessage });

  // 7. Generar respuesta
  const completion = await openai.chat.completions.create({
    model: settings.model_id || "gpt-4o",
    messages,
    temperature: settings.temperature ?? 0.7,
  });

  const responseText = completion.choices[0].message.content || "";
  const usage = completion.usage;

  // 8. Registrar en auditoría de automatizaciones
  await sb.from("automation_logs" as any).insert({
    company_id: companyId,
    automation_id: null,
    trigger_type: "nova_ai_query",
    trigger_data: { userMessage, contactId, conversationId },
    result: "SUCCESS",
    execution_data: {
      model: settings.model_id,
      tokens_prompt: usage?.prompt_tokens,
      tokens_completion: usage?.completion_tokens,
      total_tokens: usage?.total_tokens,
      response: responseText,
      reference: `nova_wa_${Date.now()}`
    }
  } as any);

  return {
    response: responseText,
    model: settings.model_id,
    usage: {
      total_tokens: usage?.total_tokens,
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
    }
  };
}
