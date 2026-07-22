import { z } from "zod";

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(120),
  product: z.string(),
  domain: z.string(),
  website: z.string().url(),
  logoUrl: z.string().url(),
  supportEmail: z.string().email(),
  whatsapp: z.string(),
  currency: z.string(),
  locale: z.string(),
  timezone: z.string(),
});

export type CompanyDTO = z.infer<typeof companySchema>;
