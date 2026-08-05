/**
 * SMS CNM — Landing content contract (MOCK PROVIDER)
 *
 * Este archivo actúa como **Mock Provider** de la Landing. Define:
 *   - Los tipos del contrato con el backend (fuente de verdad TS).
 *   - Un fallback estático usado por `landingService` mientras el Panel
 *     del Super Administrador no exponga el endpoint real.
 *
 * REGLAS DE CONSUMO (Enterprise architecture):
 *   1. Los componentes NUNCA importan `fallbackLandingContent`.
 *   2. Los componentes consumen `useLanding()` (o `useLandingContent()`)
 *      → hook → repository → service → (mock | api).
 *   3. Cuando exista backend real, sólo cambia `landingService`.
 *      Ni un componente ni un hook se modifican.
 */

export type LandingBrand = {
  logoUrl: string;
  productName: string;
  companyName: string;
  domain: string;
  websiteUrl: string;
};

export type LandingNavItem = { label: string; href: string };

export type LandingHero = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  tertiaryCta: { label: string; href: string };
  trustLine: string;
};

export type LandingNovaMessage = {
  from: "user" | "nova";
  text: string;
};

export type LandingNova = {
  title: string;
  subtitle: string;
  description: string;
  capabilities: string[];
  conversation: LandingNovaMessage[];
};

export type LandingFeature = {
  id: string;
  title: string;
  description: string;
  icon:
    | "sms"
    | "whatsapp"
    | "email"
    | "hub"
    | "flash"
    | "crm"
    | "analytics"
    | "automation"
    | "api"
    | "nova"
    | "help"
    | "pwa"
    | "responsive"
    | "affiliates"
    | "distributors";
  tone: "primary" | "nova" | "info" | "success" | "warning";
};

export type LandingStep = {
  step: number;
  title: string;
  description: string;
};

export type LandingPlanBadge = "top-seller" | "best-price" | "best-saving" | null;

export type LandingPlan = {
  id: string;
  volume: number;
  volumeLabel: string;
  pricePerSms: number;
  currency: string;
  badge: LandingPlanBadge;
  features: string[];
  cta: { label: string; href: string };
};

export type LandingCalculator = {
  currency: string;
  minInvestment: number;
  /** Precio efectivo por SMS calculado dinámicamente por API en producción. */
  tiers: Array<{ minAmount: number; pricePerSms: number }>;
  defaultAmount: number;
};

export type LandingStat = {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  format?: "integer" | "decimal" | "percent";
};

export type LandingScreenshot = {
  id: string;
  title: string;
  description: string;
  surface: "dashboard" | "crm" | "analytics" | "nova" | "campaigns" | "automations" | "api";
};

export type LandingApiHighlight = {
  title: string;
  description: string;
  items: Array<{ title: string; description: string }>;
  snippet: { language: string; code: string };
  cta: { label: string; href: string };
};

export type LandingFaqItem = { question: string; answer: string };

export type LandingCtaFinal = {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export type LandingFooter = {
  tagline: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
  social: Array<{ label: string; href: string; kind: "twitter" | "linkedin" | "instagram" | "youtube" | "whatsapp" }>;
  legalNote: string;
};

export type LandingContent = {
  brand: LandingBrand;
  nav: {
    items: LandingNavItem[];
    login: { label: string; href: string };
    signup: { label: string; href: string };
  };
  hero: LandingHero;
  nova: LandingNova;
  features: LandingFeature[];
  steps: LandingStep[];
  plans: LandingPlan[];
  calculator: LandingCalculator;
  stats: LandingStat[];
  screenshots: LandingScreenshot[];
  api: LandingApiHighlight;
  faq: LandingFaqItem[];
  ctaFinal: LandingCtaFinal;
  footer: LandingFooter;
};

/**
 * Fallback estático. Sólo se usa mientras la API del Super Admin no responda.
 * NO tratar como fuente de verdad — la única fuente es el servicio.
 */
export const fallbackLandingContent: LandingContent = {
  brand: {
    logoUrl: "https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png",
    productName: "SMS CNM",
    companyName: "CNM Digital Media SAS",
    domain: "sms.canalcnm.com",
    websiteUrl: "https://canalcnm.com",
  },
  nav: {
    items: [
      { label: "Inicio", href: "#inicio" },
      { label: "Funciones", href: "#funciones" },
      { label: "Soluciones", href: "#soluciones" },
      { label: "Planes", href: "#planes" },
      { label: "API", href: "#api" },
      { label: "Documentación", href: "#documentacion" },
      { label: "Centro de Ayuda", href: "#ayuda" },
      { label: "Contacto", href: "#contacto" },
    ],
    login: { label: "Iniciar sesión", href: "/dashboard" },
    signup: { label: "Crear Cuenta Gratis", href: "/dashboard" },
  },
  hero: {
    eyebrow: "Enterprise Omnichannel Communication Platform · IA integrada",
    title: "Una sola plataforma para",
    highlight: "SMS, WhatsApp y Email.",
    subtitle:
      "Communication Hub omnicanal: SMS Masivos, WhatsApp Business, Email Marketing, CRM, automatizaciones, analytics y CNM Nova AI en un único centro de control.",
    primaryCta: { label: "Crear Cuenta Gratis", href: "/dashboard" },
    secondaryCta: { label: "Solicitar Demo", href: "#contacto" },
    tertiaryCta: { label: "Ver API", href: "#api" },
    trustLine: "Confiado por empresas que envían millones de mensajes omnicanal al mes.",
  },
  nova: {
    title: "Conoce CNM Nova",
    subtitle: "Mucho más que una IA. Tu copiloto inteligente.",
    description:
      "CNM Nova entiende tu negocio, analiza tus campañas y toma acciones por ti. Desde crear segmentos hasta redactar y programar envíos.",
    capabilities: [
      "Analizar tu negocio en tiempo real",
      "Optimizar campañas automáticamente",
      "Consultar saldo y consumo",
      "Generar SMS con IA",
      "Programar campañas por horario óptimo",
      "Detectar clientes sin seguimiento",
    ],
    conversation: [
      { from: "user", text: "Crea una campaña para mis clientes." },
      {
        from: "nova",
        text: "Encontré 2.450 clientes. La campaña está lista para enviarse.",
      },
      { from: "user", text: "¿Cuál es la mejor hora para enviar hoy?" },
      {
        from: "nova",
        text: "10:00 AM. Tus tasas de apertura suben un 34% en esa franja.",
      },
    ],
  },
  features: [
    { id: "sms", title: "SMS Masivos", description: "Envíos a millones de destinatarios con entrega verificada y cobertura nacional.", icon: "sms", tone: "primary" },
    { id: "whatsapp", title: "WhatsApp Business", description: "Multi-número por departamento, plantillas aprobadas, campañas y conversaciones.", icon: "whatsapp", tone: "success" },
    { id: "email", title: "Email Marketing", description: "Campañas, listas, plantillas y automatizaciones de correo transaccional.", icon: "email", tone: "info" },
    { id: "hub", title: "Communication Hub", description: "Un único centro omnicanal para operar SMS, WhatsApp y Email.", icon: "hub", tone: "nova" },
    { id: "flash", title: "Flash SMS", description: "Mensajes que aparecen directamente en pantalla, ideales para OTP y alertas.", icon: "flash", tone: "warning" },
    { id: "crm", title: "CRM integrado", description: "Contactos con canal preferido y timeline unificado de SMS, WhatsApp, Email e IA.", icon: "crm", tone: "info" },
    { id: "analytics", title: "Analytics avanzado", description: "Reportes por canal en tiempo real: entrega, lectura, conversión y costo.", icon: "analytics", tone: "success" },
    { id: "automation", title: "Automatizaciones", description: "Flujos con disparadores, condiciones y esperas.", icon: "automation", tone: "primary" },
    { id: "api", title: "API REST", description: "Integra SMS, WhatsApp y Email en tu stack en menos de 5 minutos.", icon: "api", tone: "info" },
    { id: "nova", title: "CNM Nova · IA", description: "Copiloto IA que crea, optimiza y ejecuta campañas por ti.", icon: "nova", tone: "nova" },
    { id: "help", title: "Centro de Ayuda", description: "Documentación, tutoriales y soporte 24/7.", icon: "help", tone: "info" },
    { id: "pwa", title: "PWA", description: "Instalable en cualquier dispositivo, funciona offline.", icon: "pwa", tone: "primary" },
    { id: "responsive", title: "100% Responsive", description: "Diseñado para desktop, tablet y móvil por igual.", icon: "responsive", tone: "success" },
    { id: "affiliates", title: "Programa de Afiliados", description: "Gana comisiones recurrentes recomendando SMS CNM.", icon: "affiliates", tone: "warning" },
    { id: "distributors", title: "Red de Distribuidores", description: "Revende con tu propia marca y márgenes personalizados.", icon: "distributors", tone: "nova" },
  ],
  steps: [
    { step: 1, title: "Crear cuenta", description: "Regístrate en menos de 30 segundos, sin tarjeta." },
    { step: 2, title: "Recargar saldo", description: "Elige tu plan o recarga desde $150.000 COP." },
    { step: 3, title: "Importar contactos", description: "Sube tu base o conecta tu CRM en un clic." },
    { step: 4, title: "Elegir canal y enviar", description: "SMS, WhatsApp o Email: crea, prueba y programa con CNM Nova." },
    { step: 5, title: "Analizar resultados", description: "Mide entrega, respuestas y conversión en tiempo real." },
  ],
  plans: [
    { id: "p10", volume: 10000, volumeLabel: "Hasta 10.000 SMS", pricePerSms: 20, currency: "COP", badge: null, features: ["Panel completo", "CRM básico", "Soporte por correo"], cta: { label: "Comprar", href: "/dashboard" } },
    { id: "p50", volume: 50000, volumeLabel: "Hasta 50.000 SMS", pricePerSms: 18, currency: "COP", badge: null, features: ["Todo lo anterior", "Automatizaciones", "Reportes avanzados"], cta: { label: "Comprar", href: "/dashboard" } },
    { id: "p100", volume: 100000, volumeLabel: "Hasta 100.000 SMS", pricePerSms: 16, currency: "COP", badge: "top-seller", features: ["Todo lo anterior", "CNM Nova IA", "Soporte prioritario"], cta: { label: "Comprar", href: "/dashboard" } },
    { id: "p200", volume: 200000, volumeLabel: "Hasta 200.000 SMS", pricePerSms: 14, currency: "COP", badge: null, features: ["Todo lo anterior", "API dedicada", "Webhooks ilimitados"], cta: { label: "Comprar", href: "/dashboard" } },
    { id: "p300", volume: 300000, volumeLabel: "Hasta 300.000 SMS", pricePerSms: 12, currency: "COP", badge: "best-saving", features: ["Todo lo anterior", "Manager de cuenta", "SLA 99,9%"], cta: { label: "Comprar", href: "/dashboard" } },
    { id: "p500", volume: 500000, volumeLabel: "Hasta 500.000 SMS", pricePerSms: 10, currency: "COP", badge: null, features: ["Todo lo anterior", "Onboarding personalizado", "Multi-usuario"], cta: { label: "Comprar", href: "/dashboard" } },
    { id: "p1m", volume: 1000000, volumeLabel: "Hasta 1.000.000 SMS", pricePerSms: 9, currency: "COP", badge: "best-price", features: ["Todo lo anterior", "Infraestructura dedicada", "Consultoría estratégica"], cta: { label: "Comprar", href: "/dashboard" } },
  ],
  calculator: {
    currency: "COP",
    minInvestment: 150000,
    defaultAmount: 500000,
    tiers: [
      { minAmount: 150000, pricePerSms: 20 },
      { minAmount: 900000, pricePerSms: 18 },
      { minAmount: 1600000, pricePerSms: 16 },
      { minAmount: 2800000, pricePerSms: 14 },
      { minAmount: 3600000, pricePerSms: 12 },
      { minAmount: 5000000, pricePerSms: 10 },
      { minAmount: 9000000, pricePerSms: 9 },
    ],
  },
  stats: [
    { id: "clients", label: "Clientes activos", value: 3200, suffix: "+", format: "integer" },
    { id: "sent", label: "SMS enviados", value: 480, suffix: "M+", format: "integer" },
    { id: "uptime", label: "Disponibilidad", value: 99.99, suffix: "%", format: "decimal" },
    { id: "latency", label: "Tiempo de respuesta API", value: 120, suffix: " ms", format: "integer" },
    { id: "api", label: "Requests API / día", value: 12, suffix: "M", format: "integer" },
  ],
  screenshots: [
    { id: "dashboard", title: "Dashboard", description: "Centro de Comando en tiempo real.", surface: "dashboard" },
    { id: "crm", title: "CRM", description: "Contactos y segmentos avanzados.", surface: "crm" },
    { id: "analytics", title: "Analytics", description: "Métricas de entrega y conversión.", surface: "analytics" },
    { id: "nova", title: "CNM Nova", description: "Tu copiloto IA en acción.", surface: "nova" },
    { id: "campaigns", title: "Campañas", description: "Constructor visual de campañas.", surface: "campaigns" },
    { id: "automations", title: "Automatizaciones", description: "Flujos y disparadores.", surface: "automations" },
    { id: "api", title: "API", description: "Claves, logs y sandbox.", surface: "api" },
  ],
  api: {
    title: "Construido para desarrolladores.",
    description:
      "Integra SMS, WhatsApp Business y Email en tu producto con una API REST moderna, SDKs oficiales, webhooks confiables y ejemplos listos para copiar.",
    items: [
      { title: "REST API", description: "Endpoints simples, versionados y documentados." },
      { title: "SDKs oficiales", description: "Node.js, Python, PHP y más." },
      { title: "Webhooks", description: "Eventos en tiempo real con reintentos automáticos." },
      { title: "Sandbox", description: "Prueba sin gastar saldo real." },
    ],
    snippet: {
      language: "bash",
      code: `curl https://api.sms.canalcnm.com/v1/messages \\
  -H "Authorization: Bearer sk_live_..." \\
  -d to="+573001234567" \\
  -d message="Hola desde SMS CNM"`,
    },
    cta: { label: "Ver documentación", href: "#documentacion" },
  },
  faq: [
    { question: "¿Cuánto tiempo tarda la activación?", answer: "Menos de 5 minutos. Creas tu cuenta, recargas saldo y ya puedes enviar." },
    { question: "¿Puedo usar WhatsApp Business en la plataforma?", answer: "Sí. La plataforma soporta múltiples números de WhatsApp Business por empresa y departamento (Ventas, Soporte, Cobranza, Marketing). La conexión oficial con Meta se activa mediante Embedded Signup, sin copiar credenciales manualmente." },
    { question: "¿Incluye Email Marketing?", answer: "Sí. El Communication Hub incluye campañas, listas, plantillas y automatizaciones de email junto a SMS y WhatsApp." },
    { question: "¿Puedo integrar SMS CNM con mi CRM?", answer: "Sí. Ofrecemos API REST, Webhooks y conectores nativos para los CRMs más populares." },
    { question: "¿Qué es CNM Nova?", answer: "Es tu copiloto de IA. Analiza tu negocio, redacta SMS, segmenta clientes y programa campañas por ti." },
    { question: "¿Cómo funcionan los precios?", answer: "Pagas por volumen. Mientras más SMS compres, menor es el precio por unidad. Sin mensualidades ni permanencia." },
    { question: "¿Tienen SLA empresarial?", answer: "Sí. Los planes desde 300.000 SMS incluyen SLA 99,9% y manager de cuenta dedicado." },
    { question: "¿Ofrecen programa de afiliados o distribuidores?", answer: "Sí. Contamos con programa de afiliados con comisiones recurrentes y red de distribuidores con marca blanca." },
  ],
  ctaFinal: {
    title: "Empieza hoy mismo.",
    subtitle: "SMS, WhatsApp y Email desde un único Communication Hub.",
    primaryCta: { label: "Crear Cuenta Gratis", href: "/dashboard" },
    secondaryCta: { label: "Hablar con ventas", href: "#contacto" },
  },
  footer: {
    tagline: "Enterprise Omnichannel Communication Platform: SMS, WhatsApp Business y Email con IA.",
    columns: [
      {
        title: "Producto",
        links: [
          { label: "Funciones", href: "#funciones" },
          { label: "Communication Hub", href: "#funciones" },
          { label: "WhatsApp Business", href: "#funciones" },
          { label: "Email Marketing", href: "#funciones" },
          { label: "Planes", href: "#planes" },
          { label: "CNM Nova", href: "#nova" },
          { label: "Calculadora", href: "#calculadora" },
        ],
      },
      {
        title: "Desarrolladores",
        links: [
          { label: "API", href: "#api" },
          { label: "Documentación", href: "#documentacion" },
          { label: "SDKs", href: "#api" },
          { label: "Webhooks", href: "#api" },
        ],
      },
      {
        title: "Empresa",
        links: [
          { label: "Sobre CNM Digital Media", href: "https://canalcnm.com" },
          { label: "Contacto", href: "#contacto" },
          { label: "Afiliados", href: "#afiliados" },
          { label: "Distribuidores", href: "#distribuidores" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Términos", href: "#terminos" },
          { label: "Privacidad", href: "#privacidad" },
          { label: "Cookies", href: "#cookies" },
          { label: "SLA", href: "#sla" },
        ],
      },
    ],
    social: [
      { label: "WhatsApp", href: "#", kind: "whatsapp" },
      { label: "LinkedIn", href: "#", kind: "linkedin" },
      { label: "Twitter", href: "#", kind: "twitter" },
      { label: "Instagram", href: "#", kind: "instagram" },
      { label: "YouTube", href: "#", kind: "youtube" },
    ],
    legalNote: "© 2026 CNM Digital Media SAS. Todos los derechos reservados.",
  },
};
