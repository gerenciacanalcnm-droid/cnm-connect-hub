import { z } from "zod";

export const pricingSchema = z.object({
  currency: z.string(),
  minInvestment: z.number().nonnegative(),
  defaultAmount: z.number().nonnegative(),
  tiers: z.array(
    z.object({
      minAmount: z.number().nonnegative(),
      pricePerSms: z.number().nonnegative(),
    }),
  ),
});

export type PricingDTO = z.infer<typeof pricingSchema>;
