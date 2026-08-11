import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Enviar plantilla a Meta para aprobación.
 * Payload compatible con: POST /{WABA_ID}/message_templates
 */
export const submitWhatsAppTemplateToMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      id: z.string().uuid(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 1. Obtener la plantilla y la cuenta conectada
    const { data: template, error: getErr } = await context.supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("id", data.id)
      .single();

    if (getErr || !template) throw new Error("Plantilla no encontrada");

    // Buscar cuenta de la empresa
    const { data: account, error: accErr } = await context.supabase
      .from("whatsapp_accounts")
      .select("business_account_id, access_token")
      .eq("company_id", template.company_id)
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();

    if (accErr || !account || !account.business_account_id || !account.access_token) {
      throw new Error("No hay una cuenta de WhatsApp Business conectada para realizar el envío a Meta.");
    }

    // 2. Construir Payload para Meta
    // https://developers.facebook.com/docs/whatsapp/cloud-api/reference/message-templates
    const components: any[] = [];

    // Header
    if (template.header_type && template.header_type !== "NONE") {
      const headerComp: any = {
        type: "HEADER",
        format: template.header_type
      };

      if (template.header_type === "TEXT") {
        headerComp.text = template.header_text;
      } else {
        // Para media, se necesita el handle o subirlo previamente
        headerComp.example = { header_handle: [template.header_handle || ""] };
      }
      
      components.push(headerComp);
    }

    // Body
    components.push({
      type: "BODY",
      text: template.body
    });

    // Footer
    if (template.footer) {
      components.push({
        type: "FOOTER",
        text: template.footer
      });
    }

    // Buttons
    if (template.buttons && Array.isArray(template.buttons)) {
      components.push({
        type: "BUTTONS",
        buttons: template.buttons
      });
    }

    const payload = {
      name: template.name,
      category: template.category,
      language: template.language,
      components
    };

    // 3. Envío Real a Meta
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${account.business_account_id}/message_templates`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Error al enviar plantilla a Meta API");
    }

    // 4. Actualizar estado según Meta
    const metaStatus = result.status || "PENDING";
    const externalId = result.id;

    const { error: updErr } = await context.supabase
      .from("whatsapp_templates")
      .update({ 
        status: metaStatus,
        external_id: externalId,
        updated_at: new Date().toISOString()
      } as any)
      .eq("id", data.id);

    if (updErr) throw new Error(updErr.message);

    return { ok: true, status: metaStatus, metaId: externalId };
  });

