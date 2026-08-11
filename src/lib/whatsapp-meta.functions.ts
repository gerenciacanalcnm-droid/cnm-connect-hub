import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Enviar plantilla a Meta para aprobación.
 * Por ahora simula el comportamiento ya que requiere credenciales de Meta y 
 * seguir el flujo de revisión de Meta.
 */
export const submitWhatsAppTemplateToMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      id: z.string().uuid(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 1. Obtener la plantilla
    const { data: template, error: getErr } = await context.supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("id", data.id)
      .single();

    if (getErr || !template) throw new Error("Plantilla no encontrada");

    // 2. Simular envío a Meta
    // En una integración real aquí llamaríamos a:
    // POST https://graph.facebook.com/v20.0/{waba-id}/message_templates
    
    // 3. Actualizar estado a PENDING
    const { error: updErr } = await context.supabase
      .from("whatsapp_templates")
      .update({ 
        status: "PENDING",
        updated_at: new Date().toISOString()
      } as any)
      .eq("id", data.id);

    if (updErr) throw new Error(updErr.message);

    return { ok: true, status: "PENDING" };
  });
