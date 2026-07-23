import type { Notification } from "@/types/notification";
import { id, pick, minutesAgo, hoursAgo, daysAgo, resetSeed } from "./seed";

export function buildNotificationsMock(): Notification[] {
  resetSeed(0xF11E);
  const levels: Notification["level"][] = ["info", "success", "warning", "error"];
  const templates = [
    { title: "Campaña finalizada", body: "«Black Friday 2026» completó envío a 12.480 contactos.", level: "success" as const },
    { title: "Saldo bajo", body: "Tu saldo está por debajo del umbral configurado.", level: "warning" as const },
    { title: "Webhook con fallos", body: "El endpoint legacy.example.com respondió 500.", level: "error" as const },
    { title: "Nueva versión disponible", body: "CNM Nova v2.4 con recomendaciones de segmentación.", level: "info" as const },
    { title: "Factura pagada", body: "Factura F-2026-01024 marcada como pagada.", level: "success" as const },
    { title: "Recarga recibida", body: "5.000 SMS acreditados a tu cuenta.", level: "success" as const },
  ];
  return templates.map((t, i) => ({
    id: id("ntf"),
    title: t.title,
    body: t.body,
    read: i > 3,
    level: t.level ?? pick(levels),
    createdAt: i < 3 ? minutesAgo(i * 12 + 5) : i < 5 ? hoursAgo(i * 3) : daysAgo(i - 2),
  }));
}

export const notificationsMock = { list: buildNotificationsMock };
