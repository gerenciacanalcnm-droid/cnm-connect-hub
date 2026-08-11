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

// ═══════════════════ AUTOMATIONS ═══════════════════

export const listAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("automations")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid().optional(), input: z.any() }).parse(v))
  .handler(async ({ data, context }) => {
    const { id, input } = data;
    const { data: result, error } = await (context.supabase as any)
      .from("automations")
      .upsert({ ...input, id: id || undefined, company_id: CNM_COMPANY_ID })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("automations")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAutomationLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ automation_id: z.string().uuid().optional(), page: z.number().default(1) }).parse(v))
  .handler(async ({ data, context }) => {
    const limit = 20;
    const from = (data.page - 1) * limit;
    const to = from + limit - 1;
    let query = (context.supabase as any)
      .from("automation_logs")
      .select("*", { count: "exact" })
      .eq("company_id", CNM_COMPANY_ID)
      .order("executed_at", { ascending: false })
      .range(from, to);
    if (data.automation_id) query = query.eq("automation_id", data.automation_id);
    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

// ═══════════════════ NOTIFICATIONS ═══════════════════

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("notifications")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await (context.supabase as any)
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("company_id", CNM_COMPANY_ID)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("notifications")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ SETTINGS & ADMIN ═══════════════════

export const listFeatureFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("settings")
      .select("*")
      .eq("namespace", "feature_flags")
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    const { data: profiles, error: pErr } = await sb
      .from("profiles")
      .select("*");
    if (pErr) throw new Error(pErr.message);
    const { data: roles, error: rErr } = await sb
      .from("user_roles")
      .select("*");
    if (rErr) throw new Error(rErr.message);
    return { profiles: profiles ?? [], roles: roles ?? [] };
  });
