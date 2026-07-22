import type { ID } from "./common";

export type PlanBadge = "top-seller" | "best-price" | "best-saving" | null;

export interface Plan {
  id: ID;
  volume: number;
  volumeLabel: string;
  pricePerSms: number;
  currency: string;
  badge: PlanBadge;
  features: string[];
  cta: { label: string; href: string };
}

export interface Pricing {
  currency: string;
  minInvestment: number;
  defaultAmount: number;
  tiers: Array<{ minAmount: number; pricePerSms: number }>;
}

export interface Promotion {
  id: ID;
  title: string;
  description: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  discountPct?: number;
}
