import { z } from "zod";

export const planSchema = z.object({
  id: z.string(),
  volume: z.number().nonnegative(),
  volumeLabel: z.string(),
  pricePerSms: z.number().nonnegative(),
  currency: z.string(),
  badge: z.union([
    z.literal("top-seller"),
    z.literal("best-price"),
    z.literal("best-saving"),
    z.null(),
  ]),
  features: z.array(z.string()),
  cta: z.object({ label: z.string(), href: z.string() }),
});

export type PlanDTO = z.infer<typeof planSchema>;
