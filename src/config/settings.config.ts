/**
 * Settings globales de la plataforma. Reemplazables desde el Panel
 * del Super Administrador. Incluye Feature Flags globales.
 */
export const settingsConfig = {
  features: {
    landing: true,
    crm: true,
    sms: true,
    flashSms: true,
    campaigns: true,
    analytics: true,
    api: true,
    cnmNova: true,
    automations: true,
    affiliates: true,
    distributors: true,
    billing: true,
    support: true,
  },
  ui: {
    sidebarDefaultCollapsed: false,
    density: "comfortable" as "comfortable" | "compact",
  },
  notifications: {
    email: true,
    push: false,
    inApp: true,
  },
} as const;

export type SettingsConfig = typeof settingsConfig;
export type FeatureKey = keyof typeof settingsConfig.features;
