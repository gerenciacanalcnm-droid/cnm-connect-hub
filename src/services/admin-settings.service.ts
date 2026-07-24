/**
 * AdminSettingsService — Punto único de acceso a la configuración
 * del Panel Super Administrador. Actualmente resuelve desde el
 * Mock Provider (`admin.config.ts`). Al conectar el backend, solo
 * este archivo debe cambiar: ninguna UI, hook ni repositorio.
 */
import {
  adminConfig,
  defaultTariffs,
  defaultPlans,
  defaultPromotions,
  defaultPaymentMethods,
  defaultIntegrations,
  type AdminConfig,
  type TariffTier,
  type Plan,
  type Promotion,
  type PaymentMethod,
  type Integration,
} from "@/config/admin.config";

export type AdminSettings = {
  general: AdminConfig["general"];
  sms: AdminConfig["sms"];
  whatsapp: AdminConfig["whatsapp"];
  nova: AdminConfig["nova"];
  api: AdminConfig["api"];
  security: AdminConfig["security"];
  notifications: AdminConfig["notifications"];
  tariffs: TariffTier[];
  plans: Plan[];
  promotions: Promotion[];
  paymentMethods: PaymentMethod[];
  integrations: Integration[];
};

export interface AdminSettingsService {
  get(): Promise<AdminSettings>;
  getSnapshot(): AdminSettings;
  update(patch: Partial<AdminSettings>): Promise<AdminSettings>;
}

function buildSnapshot(): AdminSettings {
  return {
    general: adminConfig.general,
    sms: adminConfig.sms,
    whatsapp: adminConfig.whatsapp,
    nova: adminConfig.nova,
    api: adminConfig.api,
    security: adminConfig.security,
    notifications: adminConfig.notifications,
    tariffs: defaultTariffs,
    plans: defaultPlans,
    promotions: defaultPromotions,
    paymentMethods: defaultPaymentMethods,
    integrations: defaultIntegrations,
  };
}

export const adminSettingsService: AdminSettingsService = {
  async get() {
    return buildSnapshot();
  },
  getSnapshot() {
    return buildSnapshot();
  },
  async update() {
    throw new Error("adminSettingsService.update not implemented (backend pendiente)");
  },
};
