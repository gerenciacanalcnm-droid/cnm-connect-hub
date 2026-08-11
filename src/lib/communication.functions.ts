/**
 * Communication server functions — WhatsApp Business, Conversaciones,
 * Plantillas y Campañas multicanal.
 *
 * Todo IO pasa por `requireSupabaseAuth` → RLS aplicada como el usuario.
 * El envío descuenta saldo de la wallet correspondiente de forma atómica.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { trackServiceUsage } from "./commercial.functions";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";


const departmentSchema = z.enum(["ventas", "soporte", "cobranza", "marketing", "general"]);
const channelSchema = z.enum(["sms", "whatsapp", "email"]);

// ═══════════════════ WHATSAPP ACCOUNTS (múltiples números) ═══════════════════

export const listWhatsAppAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_accounts")
      .select(
        "id, company_id, alias, department, display_phone, status, is_primary, provider, business_account_id, phone_number_id, waba_name, quality_rating, verified_name, webhook_url, last_synced_at, created_at, updated_at",
      )
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertWhatsAppAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid().optional(),
        alias: z.string().min(1),
        department: departmentSchema.default("general"),
        displayPhone: z.string().optional().nullable(),
        isPrimary: z.boolean().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = {
      alias: data.alias,
      department: data.department,
      display_phone: data.displayPhone ?? null,
      company_id: CNM_COMPANY_ID,
    };
    const q = data.id
      ? context.supabase.from("whatsapp_accounts").update(row).eq("id", data.id).select().single()
      : context.supabase.from("whatsapp_accounts").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    if (data.isPrimary && saved) {
      await context.supabase
        .from("whatsapp_accounts")
        .update({ is_primary: false })
        .eq("company_id", CNM_COMPANY_ID)
        .neq("id", saved.id);
      await context.supabase
        .from("whatsapp_accounts")
        .update({ is_primary: true })
        .eq("id", saved.id);
    }
    return { ok: true, id: saved?.id ?? null };
  });

export const setPrimaryWhatsAppAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("whatsapp_accounts")
      .update({ is_primary: false })
      .eq("company_id", CNM_COMPANY_ID);
    const { error } = await context.supabase
      .from("whatsapp_accounts")
      .update({ is_primary: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWhatsAppAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("whatsapp_accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ WHATSAPP TEMPLATES ═══════════════════

export const listWhatsAppTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertWhatsAppTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        category: z.string().default("marketing"),
        language: z.string().default("es"),
        header: z.string().optional().nullable(),
        body: z.string().min(1),
        footer: z.string().optional().nullable(),
        variables: z.array(z.string()).default([]),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const row = {
      name: data.name,
      category: data.category,
      language: data.language,
      header: data.header ?? null,
      body: data.body,
      footer: data.footer ?? null,
      variables: data.variables as never,
      company_id: CNM_COMPANY_ID,
    };
    const q = data.id
      ? context.supabase.from("whatsapp_templates").update(row).eq("id", data.id).select().single()
      : context.supabase.from("whatsapp_templates").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true, id: saved?.id ?? null };
  });

export const deleteWhatsAppTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("whatsapp_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ WHATSAPP CAMPAIGNS ═══════════════════

export const listWhatsAppCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createWhatsAppCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        name: z.string().min(1),
        templateId: z.string().uuid().optional().nullable(),
        scheduledAt: z.string().optional().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: saved, error } = await context.supabase
      .from("whatsapp_campaigns")
      .insert({
        name: data.name,
        template_id: data.templateId ?? null,
        scheduled_at: data.scheduledAt ?? null,
        company_id: CNM_COMPANY_ID,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: saved?.id ?? null };
  });

// ═══════════════════ CONVERSATIONS ═══════════════════

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        channel: channelSchema.optional(),
        status: z.enum(["open", "pending", "closed", "archived"]).optional(),
        search: z.string().optional(),
      })
      .partial()
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("whatsapp_conversations")
      .select("*")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(200);
    if (data.channel && data.channel !== "email") q = q.eq("channel", data.channel);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`contact_name.ilike.${s},contact_phone.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listConversationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ conversationId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("whatsapp_messages")
      .select("id, body, status, direction, created_at, media_url, to_phone")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "pending", "closed", "archived"]).optional(),
        assignedTo: z.string().uuid().optional().nullable(),
        tags: z.array(z.string()).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.status) patch["status"] = data.status;
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo;
    if (data.tags) patch["tags"] = data.tags;
    const { error } = await context.supabase
      .from("whatsapp_conversations")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ ANALYTICS OMNICANAL ═══════════════════

export const getChannelAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [sms, wa] = await Promise.all([
      context.supabase.from("sms_messages").select("status, cost"),
      context.supabase.from("whatsapp_messages").select("status, cost"),
    ]);

    const summarize = (rows: { status: string; cost: number | null }[] | null) => {
      const list = rows ?? [];
      const delivered = list.filter((r) => r.status === "delivered").length;
      const read = list.filter((r) => r.status === "read").length;
      const failed = list.filter((r) => r.status === "failed" || r.status === "undelivered").length;
      const sent = list.length;
      return {
        sent,
        delivered,
        read,
        failed,
        cost: list.reduce((a, r) => a + Number(r.cost ?? 0), 0),
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
      };
    };

    return {
      sms: { channel: "sms" as const, ...summarize(sms.data) },
      whatsapp: { channel: "whatsapp" as const, ...summarize(wa.data) },
      email: {
        channel: "email" as const,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        cost: 0,
        deliveryRate: 0,
      },
    };
  });

// ═══════════════════ ENVÍO DE MENSAJES CON DESCUENTO DE SALDO ═══════════════════

/**
 * Envía un SMS y descuenta el saldo de la wallet de la empresa.
 * Implementa idempotencia mediante el ID del mensaje generado.
 */
export const sendSmsMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      to: z.string().min(8),
      body: z.string().min(1),
      provider: z.string().optional().default("CNM"),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 1. Registrar mensaje en DB (Estado: pending)
    const { data: sms, error: smsErr } = await context.supabase
      .from("sms_messages")
      .insert({
        company_id: CNM_COMPANY_ID,
        to_phone: data.to,
        body: data.body,
        status: "sending" as any,
        provider: data.provider,
        cost: 0.19, 
      })
      .select("id")
      .single();


    if (smsErr) throw new Error(smsErr.message);

    // 2. Descontar saldo de la wallet (Atómico)
    try {
      await trackServiceUsage({
        data: {
          company_id: CNM_COMPANY_ID,
          channel: "sms",
          amount: 0.19,
          units: 1,
          description: `Envío SMS a ${data.to}`,
          reference: sms.id,
        },
      });
    } catch (err: any) {

      // Si falla el cobro (ej. saldo insuficiente), marcamos como fallido
      await context.supabase
        .from("sms_messages")
        .update({ status: "failed", error_message: err.message } as never)
        .eq("id", sms.id);
      throw err;
    }

    // 3. Enviar a Gateway (Simulado para este Sprint)
    await new Promise(r => setTimeout(r, 500));
    
    // 4. Actualizar estado final
    await context.supabase
      .from("sms_messages")
      .update({ status: "sent", sent_at: new Date().toISOString() } as never)
      .eq("id", sms.id);

    return { ok: true, messageId: sms.id };
  });

/**
 * Envía un mensaje de WhatsApp y descuenta el saldo.
 */
export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      to: z.string().min(8),
      body: z.string().min(1),
      accountId: z.string().uuid(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // Tarifa WA: 0.50 por mensaje de salida
    const WA_COST = 0.50;

    // 1. Registrar mensaje
    const { data: msg, error: msgErr } = await context.supabase
      .from("whatsapp_messages")
      .insert({
        company_id: CNM_COMPANY_ID,
        to_phone: data.to,
        body: data.body,
        direction: "outbound" as any,
        status: "sending" as any,
        cost: WA_COST,
      })
      .select("id")
      .single();


    if (msgErr) throw new Error(msgErr.message);

    // 2. Cobro atómico
    try {
      await trackServiceUsage({
        data: {
          company_id: CNM_COMPANY_ID,
          channel: "whatsapp",
          amount: WA_COST,
          units: 1,
          description: `Salida WA a ${data.to}`,
          reference: msg.id,
        },
      });
    } catch (err: any) {

      await context.supabase
        .from("whatsapp_messages")
        .update({ status: "failed" } as never)
        .eq("id", msg.id);
      throw err;
    }

    // 3. Simulación de envío
    await new Promise(r => setTimeout(r, 600));

    await context.supabase
      .from("whatsapp_messages")
      .update({ status: "sent" } as never)
      .eq("id", msg.id);

    return { ok: true, messageId: msg.id };
  });

