import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Guarda o actualiza un borrador de plantilla localmente.
 */
export const saveWhatsAppTemplateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1),
      category: z.string(),
      language: z.string(),
      header: z.any().optional(),
      body: z.string().min(1),
      footer: z.string().optional(),
      buttons: z.array(z.any()).optional(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const row = {
      company_id: CNM_COMPANY_ID,
      name: data.name,
      category: data.category,
      language: data.language,
      body: data.body,
      footer: data.footer || null,
      buttons: data.buttons || [],
      header: data.header ? JSON.stringify(data.header) : null,
      status: "DRAFT",
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = data.id
      ? await context.supabase.from("whatsapp_templates").update(row).eq("id", data.id).select().single()
      : await context.supabase.from("whatsapp_templates").insert({ ...row, created_at: new Date().toISOString() }).select().single();

    if (error) throw new Error(error.message);
    return result;
  });

/**
 * Obtiene las plantillas locales.
 */
export const getWhatsAppTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });
