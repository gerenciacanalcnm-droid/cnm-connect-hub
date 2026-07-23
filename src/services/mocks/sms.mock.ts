import type { Sms } from "@/types/sms";
import { SMS_STATUS } from "@/constants/status";
import { id, pick, phone, daysAgo, minutesAgo, resetSeed } from "./seed";

const STATUSES = Object.values(SMS_STATUS);
const MESSAGES = [
  "Tu código de verificación es 8421. No lo compartas.",
  "Recordatorio: cita mañana 10:00 hs. Responde SI para confirmar.",
  "Promo exclusiva: 20% de descuento hasta el domingo.",
  "Pedido #48219 en camino. Rastréalo en cnm.mx/track/48219",
  "Bienvenido a SMS CNM. Tu cuenta está activa.",
  "Factura disponible en tu portal. Vence el 15/12.",
];

export function buildSmsMock(count = 240): Sms[] {
  resetSeed(0xC0FFEE);
  const items: Sms[] = [];
  for (let i = 0; i < count; i++) {
    const status = pick(STATUSES);
    const created = i < 40 ? minutesAgo(i * 5) : daysAgo(Math.floor(i / 20));
    items.push({
      id: id("sms"),
      to: phone(),
      from: "CNM",
      message: pick(MESSAGES),
      status,
      createdAt: created,
      deliveredAt: status === "delivered" ? created : undefined,
      companyId: "cnm-1",
    });
  }
  return items;
}

export const smsMock = { list: buildSmsMock };
