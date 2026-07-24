/**
 * Platform server functions — capa única para leer datos reales desde Supabase.
 * Solo reads públicos (config, catálogos, listados). Las escrituras del Panel
 * Super Admin quedarán detrás de `requireSupabaseAuth` + role check en el
 * próximo sprint (cuando conectemos auth). No importar `client.server` en
 * el top-level: siempre se carga dentro del handler.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ─── Global settings map (returned as JSON string to survive RPC serialization) ───
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

// ─── Feature flags ──────────────────────────────────────────────────
export const listFeatureFlags = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("feature_flags")
    .select("key, description, enabled_globally, rollout_percentage")
    .order("key");
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Permissions & roles ────────────────────────────────────────────
export const listPermissions = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("permissions")
    .select("id, code, module, description")
    .order("module");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listRolePermissions = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("role_permissions")
    .select("role, permission_id, permissions(code, module)");
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Companies ──────────────────────────────────────────────────────
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

// ─── Users (profiles + roles) ───────────────────────────────────────
export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("profiles")
    .select("id, email, full_name, avatar_url, created_at, user_roles(role)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Contacts ───────────────────────────────────────────────────────
export const listContacts = createServerFn({ method: "GET" })
  .inputValidator((v) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(20),
        search: z.string().optional(),
        tag: z.string().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = sb
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("company_id", CNM_COMPANY_ID)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`first_name.ilike.${s},last_name.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
    }
    if (data.tag) q = q.contains("tags", [data.tag]);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

// ─── Contact groups ─────────────────────────────────────────────────
export const listContactGroups = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("contact_groups")
    .select("*")
    .eq("company_id", CNM_COMPANY_ID)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Campaigns ──────────────────────────────────────────────────────
export const listCampaigns = createServerFn({ method: "GET" })
  .inputValidator((v) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(20),
        search: z.string().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = sb
      .from("campaigns")
      .select("*", { count: "exact" })
      .eq("company_id", CNM_COMPANY_ID)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

// ─── Templates ──────────────────────────────────────────────────────
export const listTemplates = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("templates")
    .select("*")
    .eq("company_id", CNM_COMPANY_ID)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Dashboard summary ──────────────────────────────────────────────
export const getDashboardSummary = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [contacts, campaigns, sms, company] = await Promise.all([
    sb.from("contacts").select("id", { count: "exact", head: true }).eq("company_id", CNM_COMPANY_ID),
    sb.from("campaigns").select("id, total_sent, total_delivered").eq("company_id", CNM_COMPANY_ID),
    sb.from("sms_messages").select("id, status, cost").eq("company_id", CNM_COMPANY_ID),
    sb.from("companies").select("balance, currency").eq("id", CNM_COMPANY_ID).maybeSingle(),
  ]);
  const smsRows = sms.data ?? [];
  const campaignRows = campaigns.data ?? [];
  const totalSent = smsRows.length;
  const totalDelivered = smsRows.filter((r) => r.status === "delivered").length;
  const totalFailed = smsRows.filter((r) => r.status === "failed").length;
  const spent = smsRows.reduce((a, r) => a + Number(r.cost ?? 0), 0);
  return {
    balance: Number(company.data?.balance ?? 0),
    currency: company.data?.currency ?? "COP",
    contactsCount: contacts.count ?? 0,
    campaignsCount: campaignRows.length,
    smsSent: totalSent,
    smsDelivered: totalDelivered,
    smsFailed: totalFailed,
    deliveryRate: totalSent === 0 ? 0 : Math.round((totalDelivered / totalSent) * 1000) / 10,
    spent,
  };
});

// ─── Landing CMS content ────────────────────────────────────────────
export const getLandingContent = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("settings")
    .select("value")
    .is("company_id", null)
    .eq("namespace", "landing")
    .eq("key", "content")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
});

// ─── Notifications ──────────────────────────────────────────────────
export const listNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("company_id", CNM_COMPANY_ID)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});
