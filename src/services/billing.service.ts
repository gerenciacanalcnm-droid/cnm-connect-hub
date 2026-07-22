import type { Plan, Pricing, Promotion } from "@/types/plan";
import { fallbackLandingContent } from "@/config/landing-content";

export interface BillingService {
  listPlans(): Promise<Plan[]>;
  getPricing(): Promise<Pricing>;
  listPromotions(): Promise<Promotion[]>;
}

export const billingService: BillingService = {
  async listPlans() {
    return fallbackLandingContent.plans as unknown as Plan[];
  },
  async getPricing() {
    return fallbackLandingContent.calculator as unknown as Pricing;
  },
  async listPromotions() {
    return [];
  },
};
