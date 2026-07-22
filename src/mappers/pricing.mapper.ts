import type { Pricing } from "@/types/plan";

export const PricingMapper = {
  fromDTO(dto: unknown): Pricing {
    return dto as Pricing;
  },
  toDTO(model: Pricing): unknown {
    return model;
  },
};
