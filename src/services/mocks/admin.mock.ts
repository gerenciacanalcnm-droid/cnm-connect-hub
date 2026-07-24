import { hoursAgo, daysAgo, pick, int, id, fullName, companyName } from "./seed";

export type AuditEntry = {
  id: string;
  user: string;
  company: string;
  action: string;
  entity: string;
  ip: string;
  at: string;
  before?: string;
  after?: string;
};

export type LogEntry = {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  channel: "system" | "api" | "sms" | "whatsapp" | "auth";
  message: string;
  at: string;
};

const ACTIONS = ["Creó", "Actualizó", "Eliminó", "Suspendió", "Activó", "Aprobó", "Rechazó"];
const ENTITIES = ["Usuario", "Empresa", "Plan", "Tarifa", "Campaña", "Recarga", "API Key"];
const IPS = ["190.145.10.22", "181.49.55.130", "138.121.4.7", "200.75.11.90", "186.86.14.5"];

export function generateAuditEntries(count = 40): AuditEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: id("aud"),
    user: fullName(),
    company: companyName(),
    action: pick(ACTIONS),
    entity: `${pick(ENTITIES)} #${int(100, 9999)}`,
    ip: pick(IPS),
    at: hoursAgo(i * 3 + 1),
    before: "N/A",
    after: "N/A",
  }));
}

const LEVELS: LogEntry["level"][] = ["info", "info", "info", "warn", "error", "debug"];
const CHANNELS: LogEntry["channel"][] = ["system", "api", "sms", "whatsapp", "auth"];
const MSGS = [
  "SMS entregado a operador",
  "API request completado 200",
  "Rate limit alcanzado para tenant",
  "Login exitoso vía Google OAuth",
  "Timeout al conectar con proveedor",
  "Reintento programado en 30s",
  "Webhook entregado correctamente",
  "Sesión expirada, refresh emitido",
];

export function generateLogs(count = 60): LogEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: id("log"),
    level: pick(LEVELS),
    channel: pick(CHANNELS),
    message: pick(MSGS),
    at: hoursAgo(i + 1),
  }));
}

export type CompanyAdmin = {
  id: string;
  name: string;
  domain: string;
  users: number;
  balance: number;
  consumption: number;
  status: "active" | "suspended" | "inactive";
  createdAt: string;
};

export function generateAdminCompanies(count = 24): CompanyAdmin[] {
  return Array.from({ length: count }, (_, i) => {
    const name = companyName();
    return {
      id: id("cmp"),
      name,
      domain: `${name.toLowerCase().replace(/\s+/g, "")}.cnm.io`,
      users: int(2, 45),
      balance: int(50_000, 5_000_000),
      consumption: int(1_000, 250_000),
      status: pick(["active", "active", "active", "suspended", "inactive"] as CompanyAdmin["status"][]),
      createdAt: daysAgo(int(1, 720)),
    };
  });
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: "active" | "suspended" | "invited";
  google: boolean;
  lastLogin: string;
};

const ROLES = ["Super Admin", "Admin", "Operador", "Analista", "Solo lectura"];

export function generateAdminUsers(count = 30): AdminUser[] {
  return Array.from({ length: count }, (_, i) => {
    const name = fullName();
    return {
      id: id("usr"),
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@cnm.io`,
      company: companyName(),
      role: pick(ROLES),
      status: pick(["active", "active", "active", "suspended", "invited"] as AdminUser["status"][]),
      google: Math.random() > 0.4,
      lastLogin: hoursAgo(int(1, 720)),
    };
  });
}
