import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

export const processContactImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    list_id: z.string().uuid(),
    contacts: z.array(z.object({
      first_name: z.string(),
      last_name: z.string().optional(),
      phone: z.string(),
      email: z.string().optional(),
    })),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const results = { imported: 0, duplicates: 0, errors: 0 };
    const { list_id, contacts } = data;
    
    for (const contact of contacts) {
      try {
        // 1. Upsert contact (idempotency by company_id, phone)
        // We ensure we get the ID whether it's new or existing.
        const { data: upsertedContact, error: upsertError } = await (context.supabase as any)
          .from("contacts")
          .upsert({
            ...contact,
            company_id: CNM_COMPANY_ID,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: "company_id, phone",
            ignoreDuplicates: false // We want to update existing ones
          })
          .select("id")
          .single();
        
        if (upsertError) {
          console.error("Upsert contact error:", upsertError);
          results.errors++;
          continue;
        }

        // 2. Associate with list (contact_list_members)
        if (upsertedContact) {
          // Idempotent association using UPSERT on the unique constraint (list_id, contact_id)
          const { error: memberError } = await (context.supabase as any)
            .from("contact_list_members")
            .upsert({
              list_id: list_id,
              contact_id: upsertedContact.id
            }, { onConflict: "list_id, contact_id" });
          
          if (memberError) {
            console.error("Association error:", memberError);
            // Even if association fails, the contact might have been created/updated.
            // But for the user, this is a failure in the requested context.
          }
        }
        
        results.imported++;
      } catch (err) {
        console.error("Unexpected import error:", err);
        results.errors++;
      }
    }
    return results;
  });
