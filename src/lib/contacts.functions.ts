import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

export const upsertContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: z.string().uuid().optional(),
    first_name: z.string(),
    last_name: z.string().optional(),
    phone: z.string(),
    email: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("contacts")
      .upsert({ 
        ...data, 
        company_id: CNM_COMPANY_ID,
        updated_at: new Date().toISOString()
      }, { onConflict: "company_id, phone" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const exportContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("contacts")
      .select("first_name, last_name, phone, email, tags")
      .eq("company_id", CNM_COMPANY_ID);
    
    if (error) throw new Error(error.message);
    
    const csv = [
      ["Nombre", "Apellido", "Telefono", "Email", "Etiquetas"].join(","),
      ...data.map((r: any) => [
        r.first_name,
        r.last_name,
        r.phone,
        r.email,
        (r.tags || []).join(";")
      ].join(","))
    ].join("\n");

    return csv;
  });

