/**
 * Configuración administrable desde el Panel Super Admin.
 * Toda esta información debe poder venir de la API en producción.
 */
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

export const adminConfig = {
  general: {
    companyName: "CNM Digital Media",
    email: "contacto@canalcnm.com",
    whatsapp: "+57 300 000 0000",
    phone: "+57 601 000 0000",
    address: "Bogotá, Colombia",
    timezone: "America/Bogota",
    language: "es",
    currency: "COP",
    iva: 19,
    minPurchase: 50000,
    logoUrl: "https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png",
    faviconUrl: "https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png",
    social: {
      facebook: "https://facebook.com/canalcnm",
      instagram: "https://instagram.com/canalcnm",
      twitter: "",
      linkedin: "",
      youtube: "",
    },
  },
  sms: {
    provider: "Infobip",
    username: "sms_cnm_prod",
    apiKey: "sk_live_••••••••••••4821",
    password: "••••••••",
    sender: "CNM",
    timeout: 30,
    retries: 3,
    flashSms: true,
    scheduleStart: "08:00",
    scheduleEnd: "20:00",
    dailyLimit: 500_000,
  },
  whatsapp: {
    provider: "Meta Business",
    phoneNumber: "",
    phoneNumberId: "",
    businessAccountId: "",
    token: "",
    webhookUrl: "",
    status: "not_configured" as "not_configured" | "configured" | "verified",
  },
  nova: {
    model: "gemini-2.5-flash",
    systemPrompt:
      "Eres CNM Nova, copiloto experto en SMS marketing y CRM para pymes hispanohablantes. Responde con claridad, orientado a acción, y sugiere próximos pasos.",
    temperature: 0.7,
    maxTokens: 1024,
    allowedActions: ["create_campaign", "segment_contacts", "draft_message", "analyze_metrics"],
    welcome: "Hola, soy CNM Nova. ¿En qué campaña te ayudo hoy?",
  },
  api: {
    rateLimit: 120,
    burst: 240,
    tokenTtlDays: 90,
    ipWhitelist: [] as string[],
  },
  security: {
    jwtExpiryMinutes: 60,
    refreshExpiryDays: 30,
    passwordMinLength: 10,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: true,
    twoFactor: true,
    captcha: true,
    googleOAuth: true,
    maxSessions: 5,
  },
  notifications: {
    email: true,
    push: true,
    inApp: true,
    sms: false,
    whatsapp: false,
  },
} as const;

export type AdminConfig = typeof adminConfig;

export const defaultTariffs: TariffTier[] = [
  { id: "t1", from: 1, to: 1000, price: 65, active: true, order: 1 },
  { id: "t2", from: 1001, to: 5000, price: 58, active: true, order: 2 },
  { id: "t3", from: 5001, to: 20_000, price: 49, active: true, order: 3 },
  { id: "t4", from: 20_001, to: 100_000, price: 42, active: true, order: 4 },
  { id: "t5", from: 100_001, to: 1_000_000, price: 35, active: true, order: 5 },
];

export const defaultPlans: Plan[] = [
  { id: "p1", name: "Starter", sms: 1000, price: 65_000, description: "Ideal para arrancar", color: "#3b82f6", order: 1, visible: true, featured: false },
  { id: "p2", name: "Business", sms: 10_000, price: 490_000, description: "Para equipos en crecimiento", color: "#8b5cf6", label: "Más popular", order: 2, visible: true, featured: true },
  { id: "p3", name: "Scale", sms: 50_000, price: 2_100_000, description: "Operación 24/7", color: "#ec4899", order: 3, visible: true, featured: false },
  { id: "p4", name: "Enterprise", sms: 250_000, price: 8_750_000, description: "Volumen dedicado", color: "#f59e0b", label: "Custom", order: 4, visible: true, featured: false },
];

export const defaultPromotions: Promotion[] = [
  { id: "pr1", name: "Bienvenida", code: "WELCOME10", discount: 10, startsAt: "2026-01-01", endsAt: "2026-12-31", active: true, auto: false },
  { id: "pr2", name: "Black Friday", code: "BLACK25", discount: 25, startsAt: "2026-11-25", endsAt: "2026-11-30", active: false, auto: true },
  { id: "pr3", name: "Verano", code: "SUMMER15", discount: 15, startsAt: "2026-06-01", endsAt: "2026-08-31", active: true, auto: false },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: "pm1", name: "PayPal", provider: "paypal", enabled: true, test: false },
  { id: "pm2", name: "Stripe", provider: "stripe", enabled: true, test: false },
  { id: "pm3", name: "Transferencia bancaria", provider: "transferencia", enabled: true, test: false },
  { id: "pm4", name: "PSE", provider: "pse", enabled: false, test: true },
];

export const defaultIntegrations: Integration[] = [
  { id: "in1", name: "Infobip", category: "sms", enabled: true, status: "connected" },
  { id: "in2", name: "Twilio", category: "sms", enabled: false, status: "disconnected" },
  { id: "in3", name: "Meta WhatsApp", category: "whatsapp", enabled: false, status: "disconnected" },
  { id: "in4", name: "Resend", category: "email", enabled: true, status: "connected" },
  { id: "in5", name: "HubSpot", category: "crm", enabled: false, status: "disconnected" },
  { id: "in6", name: "Google Analytics 4", category: "analytics", enabled: true, status: "connected" },
];
