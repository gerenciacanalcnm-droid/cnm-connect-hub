import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { trackServiceUsage } from "./commercial.functions";

const uuid = z.string().uuid();

export const sendWhatsAppSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    recipient: z.string().min(8),
    surveyId: uuid,
    companyId: uuid,
    whatsappAccountId: uuid
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1. Validar Empresa y Cuenta WhatsApp
    const { data: account, error: accErr } = await (supabase as any)
      .from("whatsapp_accounts")
      .select("phone_number_id, access_token")
      .eq("id", data.whatsappAccountId)
      .eq("company_id", data.companyId)
      .single();

    if (accErr || !account) throw new Error("Cuenta de WhatsApp no válida para esta empresa.");

    // 2. Validar Encuesta y Opciones
    const { data: survey, error: survErr } = await (supabase as any)
      .from("whatsapp_surveys")
      .select("*, options:whatsapp_survey_options(*)")
      .eq("id", data.surveyId)
      .eq("company_id", data.companyId)
      .single();

    if (survErr || !survey) throw new Error("Encuesta no encontrada.");
    const s = survey as any;
    const options = s.options || [];
    if (options.length < 1) throw new Error("La encuesta debe tener al menos 1 opción.");

    // 3. Preparar mensaje interactivo Meta basado en el tipo
    let interactive: any = {
      body: { text: s.question },
      footer: s.metadata?.footer ? { text: s.metadata.footer } : undefined
    };

    if (s.type === 'INTERACTIVE_LIST') {
      interactive.type = "list";
      interactive.header = { type: "text", text: s.title || "Encuesta" };
      interactive.action = {
        button: s.metadata?.button_text || "Ver opciones",
        sections: [
          {
            title: s.metadata?.section_title || "Opciones",
            rows: options.map((opt: any) => ({
              id: opt.option_key,
              title: opt.label.substring(0, 24),
              description: opt.metadata?.description?.substring(0, 72)
            }))
          }
        ]
      };
    } else if (s.type === 'INTERACTIVE_BUTTONS') {
      interactive.type = "button";
      
      // Header multimedia para botones
      if (s.metadata?.header_type && s.metadata?.header_type !== 'NONE') {
        const hType = s.metadata.header_type.toLowerCase();
        interactive.header = {
          type: hType,
          [hType]: hType === 'text' ? { text: s.metadata.header_text } : { link: s.metadata.header_url }
        };
      }

      interactive.action = {
        buttons: options.slice(0, 3).map((opt: any) => ({
          type: "reply",
          reply: {
            id: opt.option_key,
            title: opt.label.substring(0, 24)
          }
        }))
      };
    } else {
      // Legacy fallback
      interactive.type = "list";
      interactive.header = { type: "text", text: s.title };
      interactive.action = {
        button: "Ver opciones",
        sections: [{ title: "Opciones", rows: options.map((opt: any) => ({ id: opt.option_key, title: opt.label })) }]
      };
    }

    const interactivePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: data.recipient,
      type: "interactive",
      interactive
    };

    // 4. Registrar mensaje en estado 'sending'
    const { data: msgRow, error: msgErr } = await (supabase as any)
      .from("whatsapp_messages")
      .insert({
        company_id: data.companyId,
        to_phone: data.recipient,
        body: `[ENCUESTA] ${(survey as any).question}`,
        direction: "outbound",
        status: "sending",
        metadata: { survey_id: data.surveyId }
      } as any)
      .select("id")
      .single();

    if (msgErr) throw new Error("Error registrando mensaje.");
    const messageId = msgRow.id;

    try {
      // 5. Motor Comercial: Cobro e Idempotencia
      await trackServiceUsage({
        data: {
          company_id: data.companyId,
          channel: "whatsapp",
          units: 1,
          description: `Envío de Encuesta: ${(survey as any).title}`,
          reference: `survey_${data.surveyId}_${data.recipient}_${messageId}`
        }
      });

      // 6. Envío real a Meta Cloud API
      const metaResponse = await fetch(
        `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(interactivePayload),
        }
      );

      const metaResult = await metaResponse.json();
      if (!metaResponse.ok) {
        throw new Error(metaResult.error?.message || "Error al enviar mensaje interactivo a Meta.");
      }

      // 7. Actualizar mensaje con ID de Meta
      await (supabase as any)
        .from("whatsapp_messages")
        .update({
          status: "sent",
          external_id: metaResult.messages?.[0]?.id,
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", messageId);

      return { ok: true, messageId, metaId: metaResult.messages?.[0]?.id };

    } catch (err: any) {
      await (supabase as any)
        .from("whatsapp_messages")
        .update({ status: "failed", error_code: "send_error" } as any)
        .eq("id", messageId);
      throw err;
    }
  });

export const saveSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: uuid.optional(),
    title: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.object({
      label: z.string().min(1),
      option_key: z.string()
    })).min(2).max(10)
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    
    // Obtener profile
    const { data: profile, error: profErr } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    // Usamos duck typing/casting para acceder a company_id
    const companyId = (profile as any)?.company_id;
    if (profErr || !companyId) throw new Error("Empresa no identificada.");

    const { data: survey, error } = await (supabase as any)
      .from("whatsapp_surveys")
      .upsert({
        id: data.id,
        company_id: companyId,
        title: data.title,
        question: data.question,
        status: "ACTIVE"
      } as any)
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Borrar opciones viejas si es update
    if (data.id) {
      await (supabase as any).from("whatsapp_survey_options").delete().eq("survey_id", survey.id);
    }

    // Insertar nuevas opciones
    const optionsToInsert = data.options.map((opt, index) => ({
      survey_id: survey.id,
      label: opt.label,
      option_key: opt.option_key,
      sort_order: index
    }));

    await (supabase as any).from("whatsapp_survey_options").insert(optionsToInsert as any);

    return { id: survey.id };
  });
