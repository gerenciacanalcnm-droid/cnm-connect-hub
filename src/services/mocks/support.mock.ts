import type { SupportTicket } from "@/services/support.service";
import { id, pick, daysAgo, resetSeed } from "./seed";

const SUBJECTS = [
  "Error al importar contactos", "Consulta sobre precios enterprise",
  "Solicitud de nueva API key", "Webhook no recibe eventos",
  "Cómo programar campañas recurrentes", "Facturación electrónica",
  "Integración con HubSpot", "Reporte de SMS no entregados",
];

export function buildSupportTicketsMock(count = 18): SupportTicket[] {
  resetSeed(0x71C);
  const statuses: SupportTicket["status"][] = ["open", "pending", "resolved", "closed"];
  return Array.from({ length: count }).map((_, i) => ({
    id: id("tkt"),
    subject: pick(SUBJECTS),
    status: pick(statuses),
    createdAt: daysAgo(i + 1),
  }));
}

export const supportMock = { list: buildSupportTicketsMock };
