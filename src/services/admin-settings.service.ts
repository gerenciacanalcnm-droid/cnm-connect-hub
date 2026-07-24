/**
 * AdminSettingsService — resuelve la configuración del Super Admin desde Supabase.
 * Sin Mock Provider: los defaults viven en la migración seed (settings ns=admin).
 * Si Supabase no responde, devuelve estructura vacía coherente para no romper la UI.
 */
import { getGlobalSettings, upsertGlobalSetting } from "@/lib/platform.functions";

// ── Types (antes en admin.config.ts) ─────────────────────────────────
export type TariffTier = {
  id: string;
  from: number;
  to: number;
  price: number;
  active: boolean;
  order: number;
};

export type Plan = {
  id: string;
  name: string;
  sms: number;
  price: number;
  description: string;
  color: string;
  label?: string;
  order: number;
  visible: boolean;
  featured: boolean;
};

export type Promotion = {
  id: string;
  name: string;
  code: string;
  discount: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  auto: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  provider: "paypal" | "stripe" | "transferencia" | "pse";
  enabled: boolean;
  test: boolean;
};

export type Integration = {
  id: string;
  name: string;
  category: "sms" | "whatsapp" | "email" | "crm" | "analytics";
  enabled: boolean;
  status: "connected" | "disconnected" | "error";
};

export type GeneralSettings = {
  companyName: string;
  email: string;
  whatsapp: string;
  phone: string;
  address: string;
  timezone: string;
  language: string;
  currency: string;
  iva: number;
  minPurchase: number;
  logoUrl: string;
  faviconUrl: string;
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
};

export type SmsSettings = {
  provider: string;
  username: string;
  apiKey: string;
  password: string;
  sender: string;
  timeout: number;
  retries: number;
  flashSms: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  dailyLimit: number;
};

export type WhatsappSettings = {
  provider: string;
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string;
  token: string;
  webhookUrl: string;
  status: "not_configured" | "configured" | "verified";
};

export type NovaSettings = {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  allowedActions: string[];
  welcome: string;
};

export type ApiSettings = {
  rateLimit: number;
  burst: number;
  tokenTtlDays: number;
  ipWhitelist: string[];
};

export type SecuritySettings = {
  jwtExpiryMinutes: number;
  refreshExpiryDays: number;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  twoFactor: boolean;
  captcha: boolean;
  googleOAuth: boolean;
  maxSessions: number;
};

export type NotificationsSettings = {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  whatsapp: boolean;
};

export type AdminSettings = {
  general: GeneralSettings;
  sms: SmsSettings;
  whatsapp: WhatsappSettings;
  nova: NovaSettings;
  api: ApiSettings;
  security: SecuritySettings;
  notifications: NotificationsSettings;
  tariffs: TariffTier[];
  plans: Plan[];
  promotions: Promotion[];
  paymentMethods: PaymentMethod[];
  integrations: Integration[];
};

// ── Empty fallbacks — nunca dependen del navegador ni de mocks ────────
const EMPTY: AdminSettings = {
  general: {
    companyName: "",
    email: "",
    whatsapp: "",
    phone: "",
    address: "",
    timezone: "America/Bogota",
    language: "es",
    currency: "COP",
    iva: 0,
    minPurchase: 0,
    logoUrl: "",
    faviconUrl: "",
    social: { facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "" },
  },
  sms: {
    provider: "",
    username: "",
    apiKey: "",
    password: "",
    sender: "",
    timeout: 30,
    retries: 3,
    flashSms: false,
    scheduleStart: "08:00",
    scheduleEnd: "20:00",
    dailyLimit: 0,
  },
  whatsapp: {
    provider: "",
    phoneNumber: "",
    phoneNumberId: "",
    businessAccountId: "",
    token: "",
    webhookUrl: "",
    status: "not_configured",
  },
  nova: {
    model: "gemini-2.5-flash",
    systemPrompt: "",
    temperature: 0.7,
    maxTokens: 1024,
    allowedActions: [],
    welcome: "",
  },
  api: { rateLimit: 120, burst: 240, tokenTtlDays: 90, ipWhitelist: [] },
  security: {
    jwtExpiryMinutes: 60,
    refreshExpiryDays: 30,
    passwordMinLength: 10,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: true,
    twoFactor: false,
    captcha: false,
    googleOAuth: true,
    maxSessions: 5,
  },
  notifications: { email: true, push: false, inApp: true, sms: false, whatsapp: false },
  tariffs: [],
  plans: [],
  promotions: [],
  paymentMethods: [],
  integrations: [],
};

function pick<T>(remote: unknown, fallback: T): T {
  return remote && typeof remote === "object" && Object.keys(remote as object).length > 0
    ? ({ ...(fallback as object), ...(remote as object) } as T)
    : fallback;
}

function pickArray<T>(remote: unknown, fallback: T[]): T[] {
  return Array.isArray(remote) && remote.length > 0 ? (remote as T[]) : fallback;
}

export interface AdminSettingsService {
  get(): Promise<AdminSettings>;
  getSnapshot(): AdminSettings;
  update(patch: Partial<AdminSettings>): Promise<AdminSettings>;
}

export const adminSettingsService: AdminSettingsService = {
  async get() {
    try {
      const raw = await getGlobalSettings();
      const remote = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      const ns = remote.admin ?? {};
      return {
        general: pick(ns.general, EMPTY.general),
        sms: pick(ns.sms, EMPTY.sms),
        whatsapp: pick(ns.whatsapp, EMPTY.whatsapp),
        nova: pick(ns.nova, EMPTY.nova),
        api: pick(ns.api, EMPTY.api),
        security: pick(ns.security, EMPTY.security),
        notifications: pick(ns.notifications, EMPTY.notifications),
        tariffs: pickArray(ns.tariffs, EMPTY.tariffs),
        plans: pickArray(ns.plans, EMPTY.plans),
        promotions: pickArray(ns.promotions, EMPTY.promotions),
        paymentMethods: pickArray(ns.payment_methods, EMPTY.paymentMethods),
        integrations: pickArray(ns.integrations, EMPTY.integrations),
      };
    } catch (err) {
      console.error("[adminSettingsService] fallback vacío:", err);
      return EMPTY;
    }
  },
  getSnapshot() {
    return EMPTY;
  },
  async update(patch) {
    // Cada sección se persiste como una entrada (namespace='admin', key=<section>)
    const entries: { key: string; value: unknown }[] = [];
    if (patch.general) entries.push({ key: "general", value: patch.general });
    if (patch.sms) entries.push({ key: "sms", value: patch.sms });
    if (patch.whatsapp) entries.push({ key: "whatsapp", value: patch.whatsapp });
    if (patch.nova) entries.push({ key: "nova", value: patch.nova });
    if (patch.api) entries.push({ key: "api", value: patch.api });
    if (patch.security) entries.push({ key: "security", value: patch.security });
    if (patch.notifications) entries.push({ key: "notifications", value: patch.notifications });
    if (patch.tariffs) entries.push({ key: "tariffs", value: patch.tariffs });
    if (patch.plans) entries.push({ key: "plans", value: patch.plans });
    if (patch.promotions) entries.push({ key: "promotions", value: patch.promotions });
    if (patch.paymentMethods) entries.push({ key: "payment_methods", value: patch.paymentMethods });
    if (patch.integrations) entries.push({ key: "integrations", value: patch.integrations });
    for (const e of entries) {
      await upsertGlobalSetting({ data: { namespace: "admin", key: e.key, value: e.value } });
    }
    return this.get();
  },
};
