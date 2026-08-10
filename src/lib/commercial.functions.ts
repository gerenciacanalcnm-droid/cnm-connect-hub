/**
 * Motor Comercial — server functions (capa única de IO con Supabase).
 *
 * Lecturas públicas (catálogo comercial: planes, funcionalidades, límites,
 * tarifas) → supabaseAdmin, porque la Landing las necesita sin sesión.
 * Escrituras y datos por empresa → requireSupabaseAuth (RLS aplicada).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const uuid = z.string().uuid();
const channel = z.enum(["sms", "whatsapp", "email"]);

// ═══════════════════ CATÁLOGO DE FUNCIONALIDADES ═══════════════════
export const listCommercialFeatures = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("commercial_features")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return JSON.stringify(data ?? []);
});

// ═══════════════════ PLANES ═══════════════════
export const listPlans = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [plans, features, limits] = await Promise.all([
    sb.from("plans").select("*").order("sort_order", { ascending: true }),
    sb.from("plan_features").select("*"),
    sb.from("plan_limits").select("*"),
  ]);
  if (plans.error) throw new Error(plans.error.message);
  if (features.error) throw new Error(features.error.message);
  if (limits.error) throw new Error(limits.error.message);
  return JSON.stringify({
    plans: plans.data ?? [],
    features: features.data ?? [],
    limits: limits.data ?? [],
  });
});

const planInput = z.object({
  id: uuid.optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  price_monthly: z.number().nonnegative(),
  price_yearly: z.number().nonnegative(),
  currency: z.string().default("COP"),
  color: z.string().default("#8b5cf6"),
  icon: z.string().default("Package"),
  badge: z.string().nullable().default(null),
  sort_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export const upsertPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => planInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("plans")
      .upsert(data as never, { onConflict: "id" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("plans")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const base = src as Record<string, unknown>;
    const suffix = Date.now().toString(36);
    const copy = {
      ...base,
      id: undefined,
      code: `${String(base.code)}-copia-${suffix}`,
      name: `${String(base.name)} (copia)`,
      is_visible: false,
      sort_order: Number(base.sort_order ?? 0) + 1,
      created_at: undefined,
      updated_at: undefined,
    };
    const { data: created, error: e2 } = await context.supabase
      .from("plans")
      .insert(copy as never)
      .select("id")
      .single();
    if (e2) throw new Error(e2.message);
    const newId = (created as { id: string }).id;

    const [feats, lims] = await Promise.all([
      context.supabase.from("plan_features").select("feature_key, included, note").eq("plan_id", data.id),
      context.supabase
        .from("plan_limits")
        .select("limit_key, limit_value, unit, is_unlimited")
        .eq("plan_id", data.id),
    ]);
    if (feats.data?.length) {
      await context.supabase
        .from("plan_features")
        .insert(feats.data.map((f) => ({ ...f, plan_id: newId })) as never);
    }
    if (lims.data?.length) {
      await context.supabase
        .from("plan_limits")
        .insert(lims.data.map((l) => ({ ...l, plan_id: newId })) as never);
    }
    return { id: newId };
  });

export const setPlanFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ plan_id: uuid, feature_key: z.string().min(1), included: z.boolean() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("plan_features")
      .upsert(data as never, { onConflict: "plan_id,feature_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPlanLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        plan_id: uuid,
        limit_key: z.string().min(1),
        limit_value: z.number().int().nonnegative(),
        unit: z.string().default("unidad"),
        is_unlimited: z.boolean().default(false),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("plan_limits")
      .upsert(data as never, { onConflict: "plan_id,limit_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ TARIFAS ═══════════════════
export const listRateTiers = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("rate_tiers")
    .select("*")
    .order("channel", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return JSON.stringify(data ?? []);
});

export const upsertRateTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: uuid.optional(),
        channel,
        from_qty: z.number().int().nonnegative(),
        to_qty: z.number().int().nonnegative(),
        unit_price: z.number().nonnegative(),
        currency: z.string().default("COP"),
        is_active: z.boolean().default(true),
        sort_order: z.number().int().default(0),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("rate_tiers")
      .upsert(data as never, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRateTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rate_tiers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ PROMOCIONES ═══════════════════
export const listCommercialPromotions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("commercial_promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  });

export const upsertPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: uuid.optional(),
        name: z.string().min(1),
        code: z.string().min(1),
        kind: z.enum(["coupon", "bonus", "discount"]).default("coupon"),
        value_type: z.enum(["percent", "fixed", "units"]).default("percent"),
        value: z.number().nonnegative(),
        description: z.string().default(""),
        channel: channel.nullable().default(null),
        max_redemptions: z.number().int().nonnegative().default(0),
        starts_at: z.string().nullable().default(null),
        ends_at: z.string().nullable().default(null),
        status: z.enum(["draft", "active", "paused", "expired"]).default("draft"),
        auto_apply: z.boolean().default(false),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("commercial_promotions")
      .upsert({ ...data, created_by: context.userId } as never, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("commercial_promotions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ PASARELAS DE PAGO ═══════════════════
export const listPaymentGateways = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payment_gateways")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  });

export const updatePaymentGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: uuid,
        is_enabled: z.boolean().optional(),
        mode: z.enum(["sandbox", "live"]).optional(),
        status: z.enum(["not_configured", "configured", "error"]).optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("payment_gateways")
      .update(patch as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Prueba de conexión. No hay integración real todavía (Sprint posterior):
 * valida que existan credenciales configuradas y deja trazabilidad.
 */
export const testPaymentGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("payment_gateways")
      .select("code, config")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const cfg = ((row as { config: unknown }).config ?? {}) as Record<string, unknown>;
    const filled = Object.values(cfg).filter((x) => String(x ?? "").trim().length > 0).length;
    const ok = filled > 0;
    const message = ok
      ? "Credenciales presentes. Conexión real pendiente de habilitar el proveedor."
      : "Sin credenciales configuradas.";
    await context.supabase
      .from("payment_gateways")
      .update({
        last_test_at: new Date().toISOString(),
        last_test_ok: ok,
        last_test_message: message,
        status: ok ? "configured" : "not_configured",
      } as never)
      .eq("id", data.id);
    return { ok, message };
  });

// ═══════════════════ WALLETS ═══════════════════
export const listWallets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [wallets, recharges] = await Promise.all([
      context.supabase
        .from("wallets")
        .select("*, companies(name, plan_code)")
        .order("updated_at", { ascending: false }),
      context.supabase
        .from("recharges")
        .select("company_id, created_at, review_status")
        .eq("review_status", "aprobada")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    if (wallets.error) throw new Error(wallets.error.message);
    const last = new Map<string, string>();
    for (const r of (recharges.data ?? []) as { company_id: string; created_at: string }[]) {
      if (!last.has(r.company_id)) last.set(r.company_id, r.created_at);
    }
    const rows = (wallets.data ?? []).map((w) => {
      const row = w as Record<string, unknown>;
      return { ...row, last_recharge_at: last.get(String(row.company_id)) ?? null };
    });
    return JSON.stringify(rows);
  });

export const listWalletTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ wallet_id: uuid.optional() }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.wallet_id) q = q.eq("wallet_id", data.wallet_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return JSON.stringify(rows ?? []);
  });

/** Tipos de operación soportados por la Wallet (Sprint 10 · Fase 2). */
const operationType = z.enum([
  "RECARGA",
  "AJUSTE_CREDITO",
  "AJUSTE_DEBITO",
  "REEMBOLSO",
  "CORRECCION",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = { from: (t: string) => any };

/**
 * Acredita/debita una wallet dejando trazabilidad completa:
 * wallet → movimiento → historial comercial → auditoría.
 */
async function applyWalletMovement(
  supabase: Sb,
  input: {
    walletId: string;
    amount: number;
    units: number;
    type: z.infer<typeof operationType>;
    concept: string;
    paymentMethod?: string | null;
    reference?: string | null;
    notes?: string | null;
    performedBy: string;
  },
) {
  const { data: w, error } = await supabase
    .from("wallets")
    .select("id, company_id, balance, credits, currency")
    .eq("id", input.walletId)
    .single();
  if (error) throw new Error(error.message);
  const wallet = w as {
    company_id: string;
    balance: number;
    credits: number;
    currency: string;
  };
  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + input.amount;
  const creditsAfter = Number(wallet.credits) + input.units;

  const up = await supabase
    .from("wallets")
    .update({
      balance: balanceAfter,
      credits: creditsAfter,
      status: balanceAfter > 0 ? "active" : "inactive",
    })
    .eq("id", input.walletId);
  if (up.error) throw new Error(up.error.message);

  const metadata = {
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    concept: input.concept,
    payment_method: input.paymentMethod ?? null,
    notes: input.notes ?? null,
    performed_by: input.performedBy,
    operation_type: input.type,
  };

  const tx = await supabase
    .from("wallet_transactions")
    .insert({
      wallet_id: input.walletId,
      company_id: wallet.company_id,
      type: input.type,
      amount: input.amount,
      units: input.units,
      balance_after: balanceAfter,
      reference: input.reference ?? null,
      description: input.concept,
      metadata,
    })
    .select("id")
    .single();
  if (tx.error) throw new Error(tx.error.message);

  await supabase.from("commercial_history").insert({
    company_id: wallet.company_id,
    event_type: `wallet.${input.type.toLowerCase()}`,
    entity_type: "wallet",
    entity_id: input.walletId,
    amount: input.amount,
    currency: wallet.currency,
    description: input.concept,
    metadata,
    created_by: input.performedBy,
  });

  await supabase.from("audit_logs").insert({
    company_id: wallet.company_id,
    user_id: input.performedBy,
    module: "wallet",
    action: input.type,
    entity_type: "wallet",
    entity_id: input.walletId,
    before: { balance: balanceBefore },
    after: { balance: balanceAfter, credits: creditsAfter },
  });

  return { balanceBefore, balanceAfter, companyId: wallet.company_id };
}

export const walletOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        wallet_id: uuid,
        type: operationType,
        amount: z.number(),
        units: z.number().int().default(0),
        concept: z.string().trim().min(1).max(200),
        payment_method: z.string().max(60).nullable().default(null),
        reference: z.string().max(120).nullable().default(null),
        notes: z.string().max(500).nullable().default(null),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const signed =
      data.type === "AJUSTE_DEBITO" ? -Math.abs(data.amount) : data.amount;
    const res = await applyWalletMovement(context.supabase as unknown as Sb, {
      walletId: data.wallet_id,
      amount: signed,
      units: data.units,
      type: data.type,
      concept: data.concept,
      paymentMethod: data.payment_method,
      reference: data.reference,
      notes: data.notes,
      performedBy: context.userId,
    });
    return { ok: true, balance: res.balanceAfter };
  });

// ═══════════════════ RECARGAS ═══════════════════
export const listRechargeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recharges")
      .select("*, companies(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  });

/**
 * Solicitud de recarga desde el panel de la empresa.
 * Sin pasarela integrada aún: toda recarga entra como PENDIENTE y la aprueba
 * el Super Admin. Cuando exista confirmación real de la pasarela, bastará con
 * llamar a `reviewRecharge` con estado "aprobada" desde el webhook.
 */
export const createRechargeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        company_id: uuid,
        amount: z.number().positive().max(1_000_000_000),
        channel: channel.default("sms"),
        gateway_code: z.string().max(60).nullable().default(null),
        payment_method: z.string().max(60).default("transferencia"),
        reference: z.string().max(120).nullable().default(null),
        notes: z.string().max(500).nullable().default(null),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("recharges")
      .insert({
        company_id: data.company_id,
        amount: data.amount,
        currency: "COP",
        status: "pending",
        mode: data.gateway_code ? "automatic" : "manual",
        channel: data.channel,
        gateway_code: data.gateway_code,
        payment_method: data.payment_method,
        payment_reference: data.reference,
        review_status: "pendiente",
        created_by: context.userId,
        metadata: { notes: data.notes ?? null },
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id, reviewStatus: "pendiente" as const };
  });

export const reviewRecharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: uuid,
        review_status: z.enum(["pendiente", "aprobada", "rechazada", "anulada"]),
        review_note: z.string().default(""),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: rec, error: e0 } = await context.supabase
      .from("recharges")
      .select("id, company_id, amount, channel, review_status, payment_method, payment_reference")
      .eq("id", data.id)
      .single();
    if (e0) throw new Error(e0.message);
    const recharge = rec as {
      company_id: string;
      amount: number;
      channel: string;
      review_status: string;
      payment_method: string | null;
      payment_reference: string | null;
    };

    const { error } = await context.supabase
      .from("recharges")
      .update({
        review_status: data.review_status,
        review_note: data.review_note,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        status: data.review_status === "aprobada" ? "completed" : "pending",
        completed_at: data.review_status === "aprobada" ? new Date().toISOString() : null,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Acreditar la wallet solo en la transición a "aprobada".
    if (data.review_status === "aprobada" && recharge.review_status !== "aprobada") {
      const { data: w } = await context.supabase
        .from("wallets")
        .select("id")
        .eq("company_id", recharge.company_id)
        .eq("channel", recharge.channel)
        .maybeSingle();
      let walletId = (w as { id: string } | null)?.id;
      if (!walletId) {
        const created = await context.supabase
          .from("wallets")
          .insert({
            company_id: recharge.company_id,
            channel: recharge.channel,
            balance: 0,
            credits: 0,
            currency: "COP",
            status: "active",
          } as never)
          .select("id")
          .single();
        if (created.error) throw new Error(created.error.message);
        walletId = (created.data as { id: string }).id;
      }
      await applyWalletMovement(context.supabase as unknown as Sb, {
        walletId,
        amount: Number(recharge.amount),
        units: 0,
        type: "RECARGA",
        concept: "Recarga aprobada",
        paymentMethod: recharge.payment_method,
        reference: recharge.payment_reference,
        notes: data.review_note || null,
        performedBy: context.userId,
      });
    }
    return { ok: true };
  });


// ═══════════════════ HISTORIAL COMERCIAL ═══════════════════
export const listCommercialHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("commercial_history")
      .select("*, companies(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  });
