import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

export const processContactImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    list_id: z.string().uuid().optional(),
    contacts: z.array(z.object({
      first_name: z.string(),
      last_name: z.string().optional(),
      phone: z.string(),
      email: z.string().optional(),
    })),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const results = { imported: 0, duplicates: 0, errors: 0 };
    for (const contact of data.contacts) {
      try {
        const { error } = await (context.supabase as any)
          .from("contacts")
          .upsert({
            ...contact,
            company_id: CNM_COMPANY_ID,
          }, { onConflict: "company_id, phone" });
        
        if (error) results.errors++;
        else results.imported++;
      } catch {
        results.errors++;
      }
    }
    return results;
  });
