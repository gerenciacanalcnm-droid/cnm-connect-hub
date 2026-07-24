/**
 * AdminSettingsService — resuelve la configuración del Super Admin.
 *
 * Estrategia híbrida:
 *  - `get()` (async): lee desde Supabase (namespace `admin`). Si falla o falta
 *    una sección, cae al Mock Provider (admin.config.ts) para no romper la UI.
 *  - `getSnapshot()` (sync): sigue devolviendo el Mock. Solo lo usan formularios
 *    para inicializar valores por defecto; los datos "reales" llegan por el hook.
 *  - `update()`: pendiente hasta que exista `requireSupabaseAuth` + role check.
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
import { getGlobalSettings } from "@/lib/platform.functions";

export type {
  AdminConfig,
  TariffTier,
  Plan,
  Promotion,
  PaymentMethod,
  Integration,
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

function pick<T>(remote: unknown, fallback: T): T {
  return remote && typeof remote === "object" && Object.keys(remote as object).length > 0
    ? ({ ...(fallback as object), ...(remote as object) } as T)
    : fallback;
}

function pickArray<T>(remote: unknown, fallback: T[]): T[] {
  return Array.isArray(remote) && remote.length > 0 ? (remote as T[]) : fallback;
}

export const adminSettingsService: AdminSettingsService = {
  async get() {
    const base = buildSnapshot();
    try {
      const raw = await getGlobalSettings();
      const remote = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      const ns = remote.admin ?? {};
      return {
        general: pick(ns.general, base.general),
        sms: pick(ns.sms, base.sms),
        whatsapp: pick(ns.whatsapp, base.whatsapp),
        nova: pick(ns.nova, base.nova),
        api: pick(ns.api, base.api),
        security: pick(ns.security, base.security),
        notifications: pick(ns.notifications, base.notifications),
        tariffs: pickArray(ns.tariffs, base.tariffs),
        plans: pickArray(ns.plans, base.plans),
        promotions: pickArray(ns.promotions, base.promotions),
        paymentMethods: pickArray(ns.payment_methods, base.paymentMethods),
        integrations: pickArray(ns.integrations, base.integrations),
      };
    } catch (err) {
      console.error("[adminSettingsService] fallback a mock:", err);
      return base;
    }
  },
  getSnapshot() {
    return buildSnapshot();
  },
  async update() {
    throw new Error("adminSettingsService.update requiere auth + rol super_admin (próximo sprint).");
  },
};
