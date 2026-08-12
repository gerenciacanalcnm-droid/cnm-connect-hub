import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { processAutomationTrigger } from "./automation-engine.server";

export interface NovaResponse {
  response: string;
  model: string;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}


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

// ═══════════════════ CRM & CONTACTS ═══════════════════

export const listContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional(), tag: z.string().optional() }).parse(v))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let query = (context.supabase as any)
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("company_id", CNM_COMPANY_ID)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) query = query.or(`first_name.ilike.%${data.search}%,phone.ilike.%${data.search}%,normalized_phone.ilike.%${data.search}%`);
    if (data.tag) query = query.contains("tags", [data.tag]);
    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const createContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ 
    first_name: z.string(), 
    last_name: z.string().optional(), 
    phone: z.string(), 
    normalized_phone: z.string().optional(),
    email: z.string().optional(), 
    tags: z.array(z.string()).default([]) 
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("contacts")
      .insert({ ...data, company_id: CNM_COMPANY_ID })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await processAutomationTrigger(CNM_COMPANY_ID, "crm.new_contact", result, `contact_${result.id}`);
    return result;
  });

export const updateContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ 
    id: z.string().uuid(), 
    first_name: z.string().optional(), 
    last_name: z.string().optional(), 
    phone: z.string().optional(), 
    normalized_phone: z.string().optional(),
    email: z.string().optional(), 
    tags: z.array(z.string()).optional() 
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: result, error } = await (context.supabase as any)
      .from("contacts")
      .update(rest)
      .eq("id", id)
      .eq("company_id", CNM_COMPANY_ID)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("contacts")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listContactLists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("contact_lists")
      .select(`
        *,
        member_count:contact_list_members(count)
      `)
      .eq("company_id", CNM_COMPANY_ID);
    
    if (error) throw new Error(error.message);
    
    return (data ?? []).map((list: any) => ({
      ...list,
      contact_count: list.member_count?.[0]?.count ?? 0
    }));
  });



export const listListMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ list_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    try {
      // First, ensure the list belongs to the company
      const { data: listExists, error: listError } = await (context.supabase as any)
        .from("contact_lists")
        .select("id")
        .eq("id", data.list_id)
        .eq("company_id", CNM_COMPANY_ID)
        .maybeSingle();

      if (listError) throw new Error(listError.message);
      if (!listExists) throw new Error("La lista no existe o no pertenece a esta empresa.");

      const { data: members, error } = await (context.supabase as any)
        .from("contact_list_members")
        .select(`
          contact:contacts(*)
        `)
        .eq("list_id", data.list_id)
        .eq("company_id", CNM_COMPANY_ID);
      
      if (error) {
        console.error("Error in listListMembers:", {
          error,
          list_id: data.list_id,
          company_id: CNM_COMPANY_ID,
          table: "contact_list_members"
        });
        throw new Error(`No fue posible cargar los contactos de esta lista: ${error.message}`);
      }
      return (members ?? []).map((m: any) => m.contact).filter(Boolean);
    } catch (e: any) {
      console.error("Catch in listListMembers:", e);
      throw new Error(e.message || "Error desconocido al listar miembros");
    }
  });

export const removeMemberFromList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ list_id: z.string().uuid(), contact_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("contact_list_members")
      .delete()
      .eq("list_id", data.list_id)
      .eq("contact_id", data.contact_id)
      .eq("company_id", CNM_COMPANY_ID);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const exportListCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ list_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    try {
      // Validate list ownership
      const { data: listExists, error: listError } = await (context.supabase as any)
        .from("contact_lists")
        .select("id")
        .eq("id", data.list_id)
        .eq("company_id", CNM_COMPANY_ID)
        .maybeSingle();

      if (listError) throw new Error(listError.message);
      if (!listExists) throw new Error("La lista no existe o no pertenece a esta empresa.");

      const { data: members, error } = await (context.supabase as any)
        .from("contact_list_members")
        .select(`
          contact:contacts(
            first_name, 
            last_name, 
            phone, 
            email, 
            city,
            preferred_channel,
            tags,
            status
          )
        `)
        .eq("list_id", data.list_id)
        .eq("company_id", CNM_COMPANY_ID);
      
      if (error) {
        console.error("Error in exportListCsv:", {
          error,
          list_id: data.list_id,
          company_id: CNM_COMPANY_ID,
          table: "contact_list_members"
        });
        throw new Error(`Error al exportar lista: ${error.message}`);
      }

      const rows = (members ?? []).map((m: any) => m.contact).filter(Boolean);
      if (!rows || rows.length === 0) {
        throw new Error("No hay contactos para exportar en esta lista.");
      }

      const csv = [
        ["nombre", "telefono", "email", "ciudad", "tipo_contacto", "etiquetas", "estado"].join(","),
        ...rows.map((r: any) => [
          `"${r.first_name || ''} ${r.last_name || ''}"`.trim(),
          `"${r.phone || ''}"`,
          `"${r.email || ''}"`,
          `"${r.city || ''}"`,
          `"${r.preferred_channel || ''}"`,
          `"${(r.tags || []).join(';')}"`,
          `"${r.status || ''}"`
        ].join(","))
      ].join("\n");

      return csv;
    } catch (e: any) {
      console.error("Catch in exportListCsv:", e);
      throw new Error(e.message || "Error al exportar lista");
    }
  });

export const upsertContactList = createServerFn({ method: "POST" })

  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid().optional(), name: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("contact_lists")
      .upsert({ ...data, company_id: CNM_COMPANY_ID })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteContactList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("contact_lists")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getContactImportUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ filename: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const path = `${CNM_COMPANY_ID}/${Date.now()}_${data.filename}`;
    const { data: result, error } = await (context.supabase as any).storage
      .from("contact-imports")
      .createSignedUrl(path, 600, { upsert: true });
    if (error) throw new Error(error.message);
    return { path, signedUrl: result.signedUrl };
  });

export const importContactsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ path: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    return { imported: 0, duplicates: 0, errors: 0 };
  });

// ═══════════════════ CAMPAIGNS ═══════════════════

export const listCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional() }).parse(v))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let query = (context.supabase as any)
      .from("campaigns")
      .select("*", { count: "exact" })
      .eq("company_id", CNM_COMPANY_ID)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) query = query.ilike("name", `%${data.search}%`);
    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const upsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid().optional(), name: z.string().optional(), message_body: z.string().optional(), scheduled_at: z.string().optional(), status: z.string().optional() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("campaigns")
      .upsert({ ...data, company_id: CNM_COMPANY_ID })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("campaigns")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: original, error: getErr } = await (context.supabase as any)
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .single();
    if (getErr) throw new Error(getErr.message);
    const { id, created_at, updated_at, ...rest } = original;
    const { data: result, error } = await (context.supabase as any)
      .from("campaigns")
      .insert({ ...rest, name: `${rest.name} (Copia)`, status: "draft" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const cancelCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("campaigns")
      .update({ status: "canceled" })
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ DASHBOARD & ANALYTICS ═══════════════════

export const getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: balanceData } = await (context.supabase as any)
      .from("wallets")
      .select("balance, currency")
      .eq("company_id", CNM_COMPANY_ID)
      .maybeSingle();
    const { count: contactsCount } = await (context.supabase as any)
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("company_id", CNM_COMPANY_ID);
    const { count: campaignsCount } = await (context.supabase as any)
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("company_id", CNM_COMPANY_ID)
      .eq("status", "active");
    return {
      balance: balanceData?.balance ?? 0,
      currency: balanceData?.currency ?? "COP",
      contactsCount: contactsCount ?? 0,
      campaignsCount: campaignsCount ?? 0,
      smsSent: 0,
      smsDelivered: 0,
      smsFailed: 0,
      deliveryRate: 100,
      spent: 0
    };
  });

// ═══════════════════ API KEYS & WEBHOOKS ═══════════════════

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("api_keys")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ name: z.string(), scopes: z.array(z.string()).default([]) }).parse(v))
  .handler(async ({ data, context }) => {
    const secret = `nova_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const prefix = secret.substring(0, 8);
    const { data: row, error } = await (context.supabase as any)
      .from("api_keys")
      .insert({
        company_id: CNM_COMPANY_ID,
        name: data.name,
        key_prefix: prefix,
        key_hash: secret, // In production this would be hashed
        scopes: data.scopes
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { row, secret };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listWebhooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("webhooks")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid().optional(), input: z.any() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("webhooks")
      .upsert({ ...data.input, id: data.id || undefined, company_id: CNM_COMPANY_ID })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("webhooks")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ LANDING & PERMISSIONS ═══════════════════

export const getLandingContent = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data } = await sb
    .from("settings")
    .select("value")
    .eq("namespace", "landing")
    .eq("key", "content")
    .maybeSingle();
  return data?.value ?? { _bootstrap: true };
});

export const listPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return []; // Role-based system implemented via user_roles table
  });

export const listRolePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return [];
  });

export const upsertGlobalSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ namespace: z.string(), key: z.string(), value: z.any() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("settings")
      .upsert({ ...data, company_id: null }, { onConflict: "namespace,key,company_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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

// ═══════════════════ CONVERSATION MAPS ═══════════════════

export const listConversationMaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("conversation_maps")
      .select("*")
      .eq("company_id", CNM_COMPANY_ID)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getConversationMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("conversation_maps")
      .select("*")
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID)
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const upsertConversationMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    description: z.string().optional().nullable(),
    status: z.enum(["ACTIVO", "PAUSADO", "BORRADOR"]),
    nodes: z.array(z.any()),
    edges: z.array(z.any())
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any)
      .from("conversation_maps")
      .upsert({ ...data, company_id: CNM_COMPANY_ID })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteConversationMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("conversation_maps")
      .delete()
      .eq("id", data.id)
      .eq("company_id", CNM_COMPANY_ID);
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

export const testNovaResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ contact_id: z.string().uuid(), conversation_id: z.string().uuid(), message: z.string() }).parse(v))
  .handler(async ({ data }) => {
    const { generateNovaResponse } = await import("./nova-engine.server");
    return await generateNovaResponse(CNM_COMPANY_ID, data.contact_id, data.conversation_id, data.message) as NovaResponse;
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
