/**
 * CommercialService — mapea las tablas del Motor Comercial a modelos de dominio.
 * Componente → hook → repository → service → server function → Supabase.
 */
import * as fn from "@/lib/commercial.functions";
import type {
  CommercialFeature,
  CommercialHistoryEntry,
  CommercialPlan,
  CommercialPromotion,
  PaymentGateway,
  RateTier,
  RechargeRequest,
  Wallet,
  WalletTransaction,
} from "@/types/commercial";

type Row = Record<string, unknown>;
const s = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const n = (v: unknown, d = 0) => (v == null ? d : Number(v));
const b = (v: unknown, d = false) => (typeof v === "boolean" ? v : d);
const sn = (v: unknown) => (typeof v === "string" ? v : null);

function parse<T>(raw: string): T[] {
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export interface CommercialService {
  listFeatures(): Promise<CommercialFeature[]>;
  listPlans(): Promise<CommercialPlan[]>;
  listRateTiers(): Promise<RateTier[]>;
  listPromotions(): Promise<CommercialPromotion[]>;
  listGateways(): Promise<PaymentGateway[]>;
  listWallets(): Promise<Wallet[]>;
  listWalletTransactions(): Promise<WalletTransaction[]>;
  listRecharges(): Promise<RechargeRequest[]>;
  listHistory(): Promise<CommercialHistoryEntry[]>;
}

export const commercialService: CommercialService = {
  async listFeatures() {
    const rows = parse<Row>(await fn.listCommercialFeatures());
    return rows.map((r) => ({
      key: s(r.key),
      name: s(r.name),
      description: s(r.description),
      category: s(r.category, "general"),
      icon: s(r.icon, "Flag"),
      sortOrder: n(r.sort_order),
      isActive: b(r.is_active, true),
    }));
  },

  async listPlans() {
    const raw = await fn.listPlans();
    let payload: { plans: Row[]; features: Row[]; limits: Row[] };
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      return [];
    }
    return (payload.plans ?? []).map((p) => ({
      id: s(p.id),
      code: s(p.code),
      name: s(p.name),
      description: s(p.description),
      priceMonthly: n(p.price_monthly),
      priceYearly: n(p.price_yearly),
      currency: s(p.currency, "COP"),
      color: s(p.color, "#8b5cf6"),
      icon: s(p.icon, "Package"),
      badge: sn(p.badge),
      sortOrder: n(p.sort_order),
      isVisible: b(p.is_visible, true),
      isActive: b(p.is_active, true),
      features: (payload.features ?? [])
        .filter((f) => f.plan_id === p.id)
        .map((f) => ({ featureKey: s(f.feature_key), included: b(f.included), note: sn(f.note) })),
      limits: (payload.limits ?? [])
        .filter((l) => l.plan_id === p.id)
        .map((l) => ({
          limitKey: s(l.limit_key),
          limitValue: n(l.limit_value),
          unit: s(l.unit, "unidad"),
          isUnlimited: b(l.is_unlimited),
        })),
    }));
  },

  async listRateTiers() {
    const rows = parse<Row>(await fn.listRateTiers());
    return rows.map((r) => ({
      id: s(r.id),
      channel: s(r.channel, "sms") as RateTier["channel"],
      fromQty: n(r.from_qty),
      toQty: n(r.to_qty),
      unitPrice: n(r.unit_price),
      currency: s(r.currency, "COP"),
      isActive: b(r.is_active, true),
      sortOrder: n(r.sort_order),
    }));
  },

  async listPromotions() {
    const rows = parse<Row>(await fn.listCommercialPromotions());
    return rows.map((r) => ({
      id: s(r.id),
      name: s(r.name),
      code: s(r.code),
      kind: s(r.kind, "coupon") as CommercialPromotion["kind"],
      valueType: s(r.value_type, "percent") as CommercialPromotion["valueType"],
      value: n(r.value),
      description: s(r.description),
      channel: sn(r.channel) as CommercialPromotion["channel"],
      maxRedemptions: n(r.max_redemptions),
      redemptions: n(r.redemptions),
      startsAt: sn(r.starts_at),
      endsAt: sn(r.ends_at),
      status: s(r.status, "draft") as CommercialPromotion["status"],
      autoApply: b(r.auto_apply),
    }));
  },

  async listGateways() {
    const rows = parse<Row>(await fn.listPaymentGateways());
    return rows.map((r) => ({
      id: s(r.id),
      code: s(r.code),
      name: s(r.name),
      description: s(r.description),
      icon: s(r.icon, "CreditCard"),
      isEnabled: b(r.is_enabled),
      mode: s(r.mode, "sandbox") as PaymentGateway["mode"],
      status: s(r.status, "not_configured") as PaymentGateway["status"],
      config: (r.config ?? {}) as Record<string, unknown>,
      sortOrder: n(r.sort_order),
      lastTestAt: sn(r.last_test_at),
      lastTestOk: typeof r.last_test_ok === "boolean" ? r.last_test_ok : null,
      lastTestMessage: sn(r.last_test_message),
    }));
  },

  async listWallets() {
    const rows = parse<Row>(await fn.listWallets());
    return rows.map((r) => ({
      id: s(r.id),
      companyId: s(r.company_id),
      companyName: s((r.companies as Row | null)?.name, "—"),
      planCode: sn((r.companies as Row | null)?.plan_code),
      channel: s(r.channel, "sms") as Wallet["channel"],
      balance: n(r.balance),
      consumed: n(r.consumed),
      credits: n(r.credits),
      currency: s(r.currency, "COP"),
      status: s(r.status, "inactive") as Wallet["status"],
      lastRechargeAt: sn(r.last_recharge_at),
      updatedAt: s(r.updated_at),
    }));
  },

  async listWalletTransactions(walletId?: string) {
    const rows = parse<Row>(await fn.listWalletTransactions({ data: { wallet_id: walletId } }));
    return rows.map((r) => {
      const meta = (r.metadata ?? {}) as Row;
      return {
        id: s(r.id),
        walletId: s(r.wallet_id),
        companyId: s(r.company_id),
        type: s(r.type),
        amount: n(r.amount),
        units: n(r.units),
        balanceBefore: meta.balance_before == null ? null : n(meta.balance_before),
        balanceAfter: r.balance_after == null ? null : n(r.balance_after),
        reference: sn(r.reference),
        description: sn(r.description),
        concept: sn(meta.concept) ?? sn(r.description),
        paymentMethod: sn(meta.payment_method),
        notes: sn(meta.notes),
        performedBy: sn(meta.performed_by),
        createdAt: s(r.created_at),
      };
    });
  },

  async listRecharges() {
    const rows = parse<Row>(await fn.listRechargeRequests());
    return rows.map((r) => ({
      id: s(r.id),
      companyId: s(r.company_id),
      companyName: s((r.companies as Row | null)?.name, "—"),
      amount: n(r.amount),
      currency: s(r.currency, "COP"),
      mode: s(r.mode, "manual") as RechargeRequest["mode"],
      channel: s(r.channel, "sms") as RechargeRequest["channel"],
      gatewayCode: sn(r.gateway_code),
      receiptPath: sn(r.receipt_path),
      reviewStatus: s(r.review_status, "pendiente") as RechargeRequest["reviewStatus"],
      reviewNote: sn(r.review_note),
      reviewedAt: sn(r.reviewed_at),
      createdAt: s(r.created_at),
    }));
  },

  async listHistory() {
    const rows = parse<Row>(await fn.listCommercialHistory());
    return rows.map((r) => ({
      id: s(r.id),
      companyId: sn(r.company_id),
      companyName: sn((r.companies as Row | null)?.name),
      eventType: s(r.event_type),
      entityType: sn(r.entity_type),
      amount: r.amount == null ? null : n(r.amount),
      currency: s(r.currency, "COP"),
      description: sn(r.description),
      createdAt: s(r.created_at),
    }));
  },
};

/* ═══════════════ Escrituras del Motor Comercial ═══════════════ */

export interface CommercialWriteService {
  upsertPlan(input: Record<string, unknown>): Promise<{ id: string }>;
  deletePlan(id: string): Promise<void>;
  duplicatePlan(id: string): Promise<void>;
  setPlanFeature(planId: string, featureKey: string, included: boolean): Promise<void>;
  setPlanLimit(
    planId: string,
    limitKey: string,
    limitValue: number,
    unit: string,
    isUnlimited: boolean,
  ): Promise<void>;
  upsertRateTier(input: Record<string, unknown>): Promise<void>;
  deleteRateTier(id: string): Promise<void>;
  upsertPromotion(input: Record<string, unknown>): Promise<void>;
  deletePromotion(id: string): Promise<void>;
  updateGateway(input: Record<string, unknown>): Promise<void>;
  testGateway(id: string): Promise<{ ok: boolean; message: string }>;
  adjustWallet(input: Record<string, unknown>): Promise<void>;
  reviewRecharge(id: string, status: string, note: string): Promise<void>;
}

export const commercialWriteService: CommercialWriteService = {
  async upsertPlan(input) {
    return fn.upsertPlan({ data: input as never });
  },
  async deletePlan(id) {
    await fn.deletePlan({ data: { id } });
  },
  async duplicatePlan(id) {
    await fn.duplicatePlan({ data: { id } });
  },
  async setPlanFeature(plan_id, feature_key, included) {
    await fn.setPlanFeature({ data: { plan_id, feature_key, included } });
  },
  async setPlanLimit(plan_id, limit_key, limit_value, unit, is_unlimited) {
    await fn.setPlanLimit({ data: { plan_id, limit_key, limit_value, unit, is_unlimited } });
  },
  async upsertRateTier(input) {
    await fn.upsertRateTier({ data: input as never });
  },
  async deleteRateTier(id) {
    await fn.deleteRateTier({ data: { id } });
  },
  async upsertPromotion(input) {
    await fn.upsertPromotion({ data: input as never });
  },
  async deletePromotion(id) {
    await fn.deletePromotion({ data: { id } });
  },
  async updateGateway(input) {
    await fn.updatePaymentGateway({ data: input as never });
  },
  async testGateway(id) {
    return fn.testPaymentGateway({ data: { id } });
  },
  async walletOperation(input) {
    await fn.walletOperation({ data: input as never });
  },
  async createRecharge(input) {
    return fn.createRechargeRequest({ data: input as never });
  },
  async reviewRecharge(id, review_status, review_note) {
    await fn.reviewRecharge({ data: { id, review_status: review_status as never, review_note } });
  },
};
