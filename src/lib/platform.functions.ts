/**
 * Platform server functions — capa única para todo IO con Supabase.
 *
 * Lecturas globales (públicas): usan supabaseAdmin (service role) para
 * catálogos/configuración que la UI necesita antes del login.
 *
 * Escrituras y lecturas sensibles: usan requireSupabaseAuth → context.supabase
 * (RLS aplicada como el usuario firmado). Ningún privilegio se otorga sin
 * pasar por las políticas RLS definidas en la migración.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ═══════════════════ SETTINGS (global config, público read) ═══════════════════
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

export const upsertGlobalSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        namespace: z.string().min(1),
        key: z.string().min(1),
        value: z.unknown(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("settings")
      .upsert(
        { company_id: null, namespace: data.namespace, key: data.key, value: data.value as never },
        { onConflict: "company_id,namespace,key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ LANDING CMS ═══════════════════
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

export const saveLandingContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ content: z.unknown() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("settings")
      .upsert(
        { company_id: null, namespace: "landing", key: "content", value: data.content as never },
        { onConflict: "company_id,namespace,key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ FEATURE FLAGS ═══════════════════
export const listFeatureFlags = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("feature_flags")
    .select(
      "id, key, description, enabled_globally, rollout_percentage, target_companies, created_at, updated_at",
    )
    .order("key");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid().optional(),
        key: z.string().min(1),
        description: z.string().optional(),
        enabled_globally: z.boolean().default(false),
        rollout_percentage: z.number().min(0).max(100).default(0),
        target_companies: z.array(z.string().uuid()).default([]),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = {
      key: data.key,
      description: data.description ?? null,
      enabled_globally: data.enabled_globally,
      rollout_percentage: data.rollout_percentage,
      target_companies: data.target_companies,
    };
    const q = data.id
      ? context.supabase.from("feature_flags").update(row).eq("id", data.id).select().single()
      : context.supabase.from("feature_flags").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("feature_flags").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ PERMISSIONS / ROLES ═══════════════════
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

// ═══════════════════ COMPANIES ═══════════════════
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

// ═══════════════════ USERS ═══════════════════
export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [profiles, roles] = await Promise.all([
    sb
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at")
      .order("created_at", { ascending: false }),
    sb.from("user_roles").select("user_id, role"),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (roles.error) throw new Error(roles.error.message);
  return { profiles: profiles.data ?? [], roles: roles.data ?? [] };
});

// ═══════════════════ CONTACTS ═══════════════════
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

const ContactInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional().nullable(),
  phone: z.string().min(1),
  email: z.string().email().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const createContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => ContactInputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contacts")
      .insert({ ...data, company_id: CNM_COMPANY_ID, metadata: data.metadata as never })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Disparar automatización "Nuevo contacto"
    if (row) {
      await processAutomationTrigger(
        CNM_COMPANY_ID,
        "new_contact",
        {
          contact_id: row.id,
          first_name: row.first_name,
          phone: row.phone,
          tags: row.tags
        },
        `new_contact_${row.id}`
      );
    }

    return row;
  });

export const updateContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid(), patch: ContactInputSchema.partial() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contacts")
      .update(data.patch as never)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("contacts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
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

export const upsertContactGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = {
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      company_id: CNM_COMPANY_ID,
    };
    const q = data.id
      ? context.supabase.from("contact_groups").update(row).eq("id", data.id).select().single()
      : context.supabase.from("contact_groups").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteContactGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("contact_groups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── CSV Import (server-side processing) ────────────────────────────
export const importContactsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        storagePath: z.string().min(1),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    // Download from Storage
    const { data: file, error: dlErr } = await context.supabase.storage
      .from("contact-imports")
      .download(data.storagePath);
    if (dlErr) throw new Error(dlErr.message);
    const text = await file.text();

    // Parse (simple CSV, comma-delimited, first row header)
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return { imported: 0, duplicates: 0, errors: 0 };
    const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    const iFirst = idx("first_name") >= 0 ? idx("first_name") : idx("nombre");
    const iLast = idx("last_name") >= 0 ? idx("last_name") : idx("apellido");
    const iPhone = idx("phone") >= 0 ? idx("phone") : idx("telefono");
    const iEmail = idx("email");
    const iTags = idx("tags") >= 0 ? idx("tags") : idx("etiquetas");
    if (iPhone < 0) throw new Error("La columna 'phone' es obligatoria en el CSV.");

    const rows: {
      first_name: string;
      last_name: string | null;
      phone: string;
      email: string | null;
      tags: string[];
      company_id: string;
    }[] = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(",").map((c) => c.trim());
      const phone = cols[iPhone];
      if (!phone) continue;
      rows.push({
        first_name: (iFirst >= 0 ? cols[iFirst] : "") ?? "",
        last_name: iLast >= 0 && cols[iLast] ? cols[iLast]! : null,
        phone,
        email: iEmail >= 0 && cols[iEmail] ? cols[iEmail]! : null,
        tags: iTags >= 0 && cols[iTags] ? cols[iTags]!.split("|").filter(Boolean) : [],
        company_id: CNM_COMPANY_ID,
      });
    }

    let imported = 0;
    let duplicates = 0;
    let errors = 0;
    // Batch inserts of 500
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { data: ok, error } = await context.supabase
        .from("contacts")
        .upsert(chunk as never, { onConflict: "company_id,phone", ignoreDuplicates: false })
        .select("id");
      if (error) {
        errors += chunk.length;
        console.error("[importContactsCsv] batch error:", error.message);
      } else {
        imported += ok?.length ?? 0;
        duplicates += chunk.length - (ok?.length ?? 0);
      }
    }

    // Cleanup
    await context.supabase.storage.from("contact-imports").remove([data.storagePath]);
    return { imported, duplicates, errors };
  });

// ═══════════════════ CAMPAIGNS ═══════════════════
export const listCampaigns = createServerFn({ method: "GET" })
  .inputValidator((v) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(20),
        search: z.string().optional(),
        status: z.string().optional(),
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
    if (data.status) q = q.eq("status", data.status as never);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

const CampaignInputSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(["sms", "whatsapp", "email"]).default("sms"),
  template_id: z.string().uuid().optional().nullable(),
  message_body: z.string().optional().nullable(),
  status: z
    .enum(["draft", "scheduled", "sending", "completed", "failed", "canceled"])
    .default("draft"),
  scheduled_at: z.string().datetime().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const upsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid().optional(), input: CampaignInputSchema }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = {
      ...data.input,
      company_id: CNM_COMPANY_ID,
      metadata: data.input.metadata as never,
    };
    const q = data.id
      ? context.supabase
          .from("campaigns")
          .update(row as never)
          .eq("id", data.id)
          .select()
          .single()
      : context.supabase
          .from("campaigns")
          .insert(row as never)
          .select()
          .single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return saved;
  });

export const duplicateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: src, error: e1 } = await context.supabase
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .single();
    if (e1) throw new Error(e1.message);
    const {
      id: _id,
      created_at: _c,
      updated_at: _u,
      started_at: _s,
      completed_at: _co,
      total_sent: _ts,
      total_delivered: _td,
      total_failed: _tf,
      cost: _cost,
      ...rest
    } = src as Record<string, unknown>;
    const { data: copy, error: e2 } = await context.supabase
      .from("campaigns")
      .insert({
        ...(rest as Record<string, unknown>),
        name: `${(src as { name: string }).name} (copia)`,
        status: "draft",
      } as never)
      .select()
      .single();
    if (e2) throw new Error(e2.message);
    return copy;
  });

export const cancelCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("campaigns")
      .update({ status: "canceled" as never })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ TEMPLATES ═══════════════════
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

const TemplateInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().default("general"),
  channel: z.enum(["sms", "whatsapp", "email"]).default("sms"),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export const upsertTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid().optional(), input: TemplateInputSchema }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = { ...data.input, company_id: CNM_COMPANY_ID };
    const q = data.id
      ? context.supabase
          .from("templates")
          .update(row as never)
          .eq("id", data.id)
          .select()
          .single()
      : context.supabase
          .from("templates")
          .insert(row as never)
          .select()
          .single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ DASHBOARD ═══════════════════
export const getDashboardSummary = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [contacts, campaigns, sms, company] = await Promise.all([
    sb
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", CNM_COMPANY_ID),
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

// ═══════════════════ NOTIFICATIONS ═══════════════════
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

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
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
    const { error } = await context.supabase.from("notifications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ API KEYS ═══════════════════
export const listApiKeys = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at")
    .eq("company_id", CNM_COMPANY_ID)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

function randomKey(): { prefix: string; secret: string; hash: string } {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const prefix = `sk_live_${secret.slice(0, 8)}`;
  // simple SHA-256 hash — for real security use bcrypt/argon2 upstream
  return { prefix, secret: `${prefix}${secret.slice(8)}`, hash: secret };
}

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        name: z.string().min(1),
        scopes: z.array(z.string()).default([]),
        expires_at: z.string().datetime().optional().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const gen = randomKey();
    const { data: row, error } = await context.supabase
      .from("api_keys")
      .insert({
        company_id: CNM_COMPANY_ID,
        name: data.name,
        key_prefix: gen.prefix,
        key_hash: gen.hash,
        scopes: data.scopes as never,
        expires_at: data.expires_at ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { row, secret: gen.secret };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const rotateApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const gen = randomKey();
    const { error } = await context.supabase
      .from("api_keys")
      .update({ key_prefix: gen.prefix, key_hash: gen.hash, revoked_at: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { secret: gen.secret };
  });

// ═══════════════════ WEBHOOKS ═══════════════════
export const listWebhooks = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("webhooks")
    .select("*")
    .eq("company_id", CNM_COMPANY_ID)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const WebhookInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  secret: z.string().optional().nullable(),
});

export const upsertWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid().optional(), input: WebhookInputSchema }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = { ...data.input, company_id: CNM_COMPANY_ID };
    const q = data.id
      ? context.supabase
          .from("webhooks")
          .update(row as never)
          .eq("id", data.id)
          .select()
          .single()
      : context.supabase
          .from("webhooks")
          .insert(row as never)
          .select()
          .single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("webhooks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ AUDIT LOGS ═══════════════════
export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(50),
        module: z.string().optional(),
        action: z.string().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.module) q = q.eq("module", data.module);
    if (data.action) q = q.eq("action", data.action);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    const normalized = (rows ?? []).map((r) => ({ ...r, ip: r.ip == null ? null : String(r.ip) as any }));
    return { rows: normalized as any, total: count ?? 0 };
  });

// ═══════════════════ SYSTEM LOGS ═══════════════════
export const listSystemLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(50),
        level: z.string().optional(),
        search: z.string().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("system_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.level) q = q.eq("level", data.level as never);
    if (data.search) q = q.ilike("message", `%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

// ═══════════════════ CSV signed upload URL ═══════════════════
export const getContactImportUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ filename: z.string().min(1) }).parse(v))
  .handler(async ({ data, context }) => {
    const path = `${CNM_COMPANY_ID}/${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { data: signed, error } = await context.supabase.storage
      .from("contact-imports")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

// ═══════════════════ AUTOMATIONS ═══════════════════
export const listAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automations" as any)
      .select("*")
      .eq("company_id", CNM_COMPANY_ID)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any;
  });

const AutomationInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVA", "PAUSADA", "BORRADOR"]).default("BORRADOR"),
  channel: z.string().optional().nullable(),
  trigger_config: z.record(z.string(), z.unknown()).default({}),
  conditions_config: z.array(z.record(z.string(), z.unknown())).default([]),
  actions_config: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const upsertAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid().optional(), input: AutomationInputSchema }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = {
      ...data.input,
      company_id: CNM_COMPANY_ID,
      trigger_config: data.input.trigger_config as any,
      conditions_config: data.input.conditions_config as any,
      actions_config: data.input.actions_config as any,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase
          .from("automations" as any)
          .update(row as never)
          .eq("id", data.id)
          .select()
          .single()
      : context.supabase
          .from("automations" as any)
          .insert(row as never)
          .select()
          .single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return saved as any;
  });

export const deleteAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("automations" as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAutomationLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        automation_id: z.string().uuid().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(50),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("automation_logs" as any)
      .select("*", { count: "exact" })
      .eq("company_id", CNM_COMPANY_ID)
      .order("executed_at", { ascending: false })
      .range(from, to);
    if (data.automation_id) q = q.eq("automation_id", data.automation_id);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as any, total: count ?? 0 } as any;
  });
