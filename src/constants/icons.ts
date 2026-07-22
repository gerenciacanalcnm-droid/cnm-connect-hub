/**
 * Mapeo simbólico de iconos por dominio. Los componentes resuelven el
 * componente Lucide correspondiente. Aquí solo se enumera el contrato.
 */
export const ICON_KEYS = [
  "dashboard",
  "crm",
  "sms",
  "flash",
  "campaigns",
  "analytics",
  "automation",
  "api",
  "nova",
  "billing",
  "support",
  "settings",
  "company",
  "notifications",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];
