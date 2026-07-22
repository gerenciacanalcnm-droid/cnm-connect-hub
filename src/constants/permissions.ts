export const PERMISSIONS = {
  // Landing / configuración global
  landingRead: "landing:read",
  landingWrite: "landing:write",
  // Empresa
  companyRead: "company:read",
  companyWrite: "company:write",
  // SMS
  smsSend: "sms:send",
  smsRead: "sms:read",
  // Campañas
  campaignCreate: "campaign:create",
  campaignRead: "campaign:read",
  // Analytics
  analyticsRead: "analytics:read",
  // Facturación
  billingRead: "billing:read",
  billingWrite: "billing:write",
  // Usuarios
  usersRead: "users:read",
  usersWrite: "users:write",
  // Super Admin
  systemAdmin: "system:admin",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
