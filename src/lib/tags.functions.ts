import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

// TAGS

export const listContactTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("contact_tags")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID)
      .eq("is_active", true)
      .order("name");
    
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createContactTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("contact_tags")
      .insert({
        ...data,
        company_id: CNM_COMPANY_ID,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return result;
  });

export const updateContactTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    is_active: z.boolean().optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("contact_tags")
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteContactTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: z.string().uuid()
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("contact_tags")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

// TAG ASSIGNMENTS

export const assignTagToContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    contact_id: z.string().uuid(),
    tag_id: z.string().uuid(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("contact_tag_members")
      .upsert({
        ...data,
        company_id: CNM_COMPANY_ID,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return result;
  });

export const removeTagFromContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    contact_id: z.string().uuid(),
    tag_id: z.string().uuid(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("contact_tag_members")
      .delete()
      .eq("contact_id", data.contact_id)
      .eq("tag_id", data.tag_id)
      .eq("company_id", CNM_COMPANY_ID);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listContactTagsForContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    contact_id: z.string().uuid()
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: results, error } = await (context.supabase as any)
      .from("contact_tag_members")
      .select(`
        tag_id,
        contact_tags (
          id,
          name,
          color,
          description
        )
      `)
      .eq("contact_id", data.contact_id)
      .eq("company_id", CNM_COMPANY_ID);
    
    if (error) throw new Error(error.message);
    return results?.map((r: any) => r.contact_tags).filter(Boolean) || [];
  });

export const listContactsByTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    tag_id: z.string().uuid()
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: results, error } = await (context.supabase as any)
      .from("contact_tag_members")
      .select(`
        contact_id,
        contacts (
          *
        )
      `)
      .eq("tag_id", data.tag_id)
      .eq("company_id", CNM_COMPANY_ID);
    
    if (error) throw new Error(error.message);
    return results?.map((r: any) => r.contacts).filter(Boolean) || [];
  });
