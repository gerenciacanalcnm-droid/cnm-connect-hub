/**
 * SMS CNM — Site configuration
 * CNM Digital Media
 */
export const siteConfig = {
  name: "SMS CNM",
  shortName: "SMS CNM",
  company: "CNM Digital Media",
  domain: "sms.canalcnm.com",
  url: "https://sms.canalcnm.com",
  tagline: "Conecta con tus clientes en segundos.",
  description:
    "Plataforma SaaS Enterprise de comunicación por SMS, CRM, automatizaciones y analítica avanzada. Diseñada para escalar.",
  locale: "es-ES",
  defaultLocale: "es",
  supportedLocales: ["es", "en"] as const,
  contact: {
    email: "soporte@canalcnm.com",
    support: "https://sms.canalcnm.com/soporte",
  },
  social: {
    twitter: "@canalcnm",
  },
} as const;

export type SiteConfig = typeof siteConfig;
