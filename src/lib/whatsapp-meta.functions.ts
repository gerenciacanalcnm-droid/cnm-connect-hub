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
    const components: any[] = [];
    const metadata = (template as any).metadata || {};

    // Header
    const headerType = metadata.header_type || "NONE";
    if (headerType !== "NONE") {
      const headerComp: any = {
        type: "HEADER",
        format: headerType,
      };

      if (headerType === "TEXT") {
        headerComp.text = metadata.header_text || template.header;
      } else {
        // Para Media (IMAGE, VIDEO, DOCUMENT) Meta requiere un handle de ejemplo
        // El handle debe ser el devuelto por la API de subida de Meta
        const mediaHandle = metadata.header_handle || metadata.media_id;
        headerComp.example = { 
          header_handle: [mediaHandle || "4_IMAGE_HANDLE_PLACEHOLDER"] 
        };
      }
      components.push(headerComp);
    }

    // Body
    // Extraer variables {{n}} para el ejemplo
    const variables = template.body.match(/\{\{(\d+)\}\}/g) || [];
    const bodyComp: any = {
      type: "BODY",
      text: template.body,
    };

    if (variables.length > 0) {
      // Meta requiere que body_text sea un array de arrays de strings (uno por cada juego de variables)
      bodyComp.example = {
        body_text: [variables.map((_, i) => `Ejemplo ${i + 1}`)]
      };
    }
    components.push(bodyComp);

    // Footer
    if (template.footer) {
      components.push({
        type: "FOOTER",
        text: template.footer
      });
    }

    // Buttons
    if (template.buttons && Array.isArray(template.buttons) && template.buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: (template.buttons as any[]).map(b => {
          const btn: any = { type: b.type, text: b.text };
          if (b.type === 'URL') btn.url = b.url;
          if (b.type === 'PHONE') btn.phone_number = b.phoneNumber;
          return btn;
        })
      });
    }

    // The redundant logic block building components again was removed to fix duplicate variable declarations.

    const payload = {
      name: template.name,
      category: template.category,
      language: template.language,
      components
    };

    // Log del payload sanitizado (sin tokens)
    console.log("META_PAYLOAD_SANITTIZED:", {
      name: payload.name,
      language: payload.language,
      category: payload.category,
      components: payload.components.map(c => ({
        type: c.type,
        format: c.format,
        has_header_handle: !!c.example?.header_handle,
        variables_count: c.text?.match(/\{\{(\d+)\}\}/g)?.length || 0,
        has_example: !!c.example
      }))
    });

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
      const metaError = result.error || {};
      const errorMessage = `META_TEMPLATE_CREATE_ERROR
HTTP: ${response.status}
Code: ${metaError.code || 'N/A'}
Subcode: ${metaError.error_subcode || 'N/A'}
Message: ${metaError.message || 'Error desconocido'}
Type: ${metaError.type || 'N/A'}
Trace ID: ${metaError.fbtrace_id || 'N/A'}`;
      
      console.error("Meta API Error:", result);
      throw new Error(errorMessage);
    }

    // 4. Actualizar estado según Meta
    const metaStatus = result.status || "PENDING";
    const externalId = result.id;

    const { error: updErr } = await context.supabase
      .from("whatsapp_templates")
      .update({ 
        status: metaStatus,
        external_id: externalId,
        metadata: { 
          ...metadata, 
          meta_response: result,
          last_sync: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      } as any)
      .eq("id", data.id);

    if (updErr) throw new Error(`Error al actualizar DB: ${updErr.message}`);

    return { ok: true, status: metaStatus, metaId: externalId };
  });

