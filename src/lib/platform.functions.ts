import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { processAutomationTrigger } from "./automation-engine.server";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getGlobalSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("settings")
    .select("namespace, key, value")
    .is("company_id", null);
  if (error) throw new Error(error.message);
  const out: Record<string, Record<string, unknown>> = {};
  for (const row of data ?? []) {
    out[row.namespace] ??= {};
    out[row.namespace]![row.key] = row.value;
  }
  return JSON.stringify(out);
});

export const listCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCurrentCompany = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("companies")
    .select("*")
    .eq("slug", "cnm-digital-media")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

// Mock functions for missing ones that might be imported elsewhere
export const listContacts = createServerFn({ method: "GET" }).handler(() => ({ rows: [], total: 0 }));
export const createContact = createServerFn({ method: "POST" }).handler(() => ({}));
export const listCampaigns = createServerFn({ method: "GET" }).handler(() => ({ rows: [], total: 0 }));
export const upsertCampaign = createServerFn({ method: "POST" }).handler(() => ({}));

// ═══════════════════ CNM NOVA (IA Assistant) ═══════════════════

const NovaSettingsSchema = z.object({
  status: z.enum(["ACTIVO", "PAUSADO"]),
  name: z.string().min(1),
  personality: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  language: z.string().default("es"),
  model_id: z.string().default("gpt-4o"),
  temperature: z.number().min(0).max(2).default(0.7),
  initial_message: z.string().optional().nullable(),
  not_found_message: z.string().optional().nullable(),
});

const NovaKnowledgeSchema = z.object({
  company_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  products: z.string().optional().nullable(),
  services: z.string().optional().nullable(),
  business_hours: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

export const getNovaSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("nova_settings")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveNovaSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => NovaSettingsSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("nova_settings")
      .upsert({ ...data, company_id: CNM_COMPANY_ID }, { onConflict: "company_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getNovaKnowledge = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("nova_knowledge")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveNovaKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => NovaKnowledgeSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("nova_knowledge")
      .upsert({ ...data, company_id: CNM_COMPANY_ID }, { onConflict: "company_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getNovaClientContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ contact_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: contact, error: cErr } = await (context.supabase as any)
      .from("contacts")
      .select("*, tags")
      .eq("id", data.contact_id)
      .single();
    if (cErr) throw new Error(cErr.message);

    const { data: convs, error: convErr } = await (context.supabase as any)
      .from("whatsapp_conversations")
      .select("*, whatsapp_messages(*)")
      .eq("contact_id", data.contact_id)
      .order("updated_at", { ascending: false })
      .limit(1);
      
    return {
      contact,
      conversations: convs ?? [],
    };
  });
