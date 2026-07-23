import type { Campaign } from "@/types/campaign";
import { CAMPAIGN_STATUS } from "@/constants/status";
import { id, pick, int, daysAgo, resetSeed } from "./seed";

const STATUSES = Object.values(CAMPAIGN_STATUS);
const NAMES = [
  "Black Friday 2026", "Bienvenida clientes nuevos", "Recordatorio de cita",
  "Reactivación inactivos", "Encuesta NPS Q4", "Promoción cumpleaños",
  "Notificación de envío", "Cross-sell farmacias", "Renovación suscripción",
  "Alerta abandono carrito", "Confirmación de pago", "Feedback post-venta",
  "Lanzamiento nuevo servicio", "Reactivación premium", "Programa referidos",
];

export function buildCampaignsMock(count = 60): Campaign[] {
  resetSeed(0xCA11);
  const items: Campaign[] = [];
  for (let i = 0; i < count; i++) {
    const status = pick(STATUSES);
    const name = `${pick(NAMES)} · ${i + 1}`;
    items.push({
      id: id("cmp"),
      name,
      status,
      message: "Aprovecha esta oferta única. Responde STOP para cancelar.",
      audienceSize: int(500, 45_000),
      scheduledAt: status === "scheduled" ? daysAgo(-int(1, 14)) : undefined,
      createdAt: daysAgo(int(0, 90)),
      companyId: "cnm-1",
    });
  }
  return items;
}

export const campaignsMock = { list: buildCampaignsMock };
