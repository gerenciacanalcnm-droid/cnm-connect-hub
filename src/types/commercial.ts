/**
 * Motor Comercial — contratos de dominio.
 * Fuente de verdad: tablas Supabase (plans, plan_features, plan_limits,
 * rate_tiers, commercial_promotions, payment_gateways, wallets, recharges).
 */

export type CommercialChannel = "sms" | "whatsapp" | "email";

export type CommercialFeature = {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

export type PlanFeature = {
  featureKey: string;
  included: boolean;
  note: string | null;
};

export type PlanLimit = {
  limitKey: string;
  limitValue: number;
  unit: string;
  isUnlimited: boolean;
};

export type CommercialPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  color: string;
  icon: string;
  badge: string | null;
  sortOrder: number;
  isVisible: boolean;
  isActive: boolean;
  features: PlanFeature[];
  limits: PlanLimit[];
};

export type RateTier = {
  id: string;
  channel: CommercialChannel;
  fromQty: number;
  toQty: number;
  unitPrice: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

export type PromotionKind = "coupon" | "bonus" | "discount";
export type PromotionValueType = "percent" | "fixed" | "units";
export type PromotionStatus = "draft" | "active" | "paused" | "expired";

export type CommercialPromotion = {
  id: string;
  name: string;
  code: string;
  kind: PromotionKind;
  valueType: PromotionValueType;
  value: number;
  description: string;
  channel: CommercialChannel | null;
  maxRedemptions: number;
  redemptions: number;
  startsAt: string | null;
  endsAt: string | null;
  status: PromotionStatus;
  autoApply: boolean;
};

export type GatewayMode = "sandbox" | "live";
export type GatewayStatus = "not_configured" | "configured" | "error";

export type PaymentGateway = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  mode: GatewayMode;
  status: GatewayStatus;
  config: Record<string, unknown>;
  sortOrder: number;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
};

export type Wallet = {
  id: string;
  companyId: string;
  companyName: string;
  channel: CommercialChannel;
  balance: number;
  consumed: number;
  credits: number;
  currency: string;
  status: "active" | "inactive" | "suspended";
  updatedAt: string;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  units: number;
  balanceAfter: number | null;
  reference: string | null;
  description: string | null;
  createdAt: string;
};

export type RechargeReviewStatus = "pendiente" | "aprobada" | "rechazada" | "anulada";

export type RechargeRequest = {
  id: string;
  companyId: string;
  companyName: string;
  amount: number;
  currency: string;
  mode: "manual" | "automatic";
  channel: CommercialChannel;
  gatewayCode: string | null;
  receiptPath: string | null;
  reviewStatus: RechargeReviewStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type CommercialHistoryEntry = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  eventType: string;
  entityType: string | null;
  amount: number | null;
  currency: string;
  description: string | null;
  createdAt: string;
};
