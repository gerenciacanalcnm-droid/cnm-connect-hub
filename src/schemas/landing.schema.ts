import { z } from "zod";

/**
 * Schema laxo del contenido de la Landing. Se valida al recibir del backend.
 * La estructura fuerte vive en `@/config/landing-content` como tipos TS.
 */
export const landingSchema = z
  .object({
    brand: z.object({
      logoUrl: z.string(),
      productName: z.string(),
      companyName: z.string(),
      domain: z.string(),
      websiteUrl: z.string(),
    }),
    hero: z.object({
      title: z.string(),
      highlight: z.string(),
      subtitle: z.string(),
    }),
  })
  .passthrough();

export type LandingDTO = z.infer<typeof landingSchema>;
