/**
 * Configuración de empresa por defecto (multitenant-ready).
 * En producción vendrá del Panel del Super Administrador.
 */
export const companyConfig = {
  id: "cnm-digital-media",
  name: "CNM Digital Media SAS",
  product: "SMS CNM",
  domain: "sms.canalcnm.com",
  website: "https://canalcnm.com",
  logoUrl: "https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png",
  supportEmail: "soporte@canalcnm.com",
  whatsapp: "+573000000000",
  currency: "COP",
  locale: "es-CO",
  timezone: "America/Bogota",
} as const;

export type CompanyConfig = typeof companyConfig;
