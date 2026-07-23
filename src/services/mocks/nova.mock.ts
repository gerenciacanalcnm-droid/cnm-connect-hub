import type { NovaMessage } from "@/services/nova.service";

export const NOVA_SUGGESTIONS = [
  "Segmenta contactos inactivos hace 30 días",
  "Sugiere el mejor horario para enviar mi próxima campaña",
  "Compara tasa de entrega vs mes anterior",
  "Detecta números duplicados en mi base",
  "Redacta un SMS de bienvenida con emojis",
  "¿Cuánto ahorraría contratando el plan Growth?",
];

export const NOVA_HISTORY: NovaMessage[] = [
  { from: "user", text: "Analiza mi última campaña" },
  { from: "nova", text: "«Black Friday 2026» tuvo 95.4% de entrega. Detecté 214 fallos concentrados en Telcel. ¿Quieres que reintente los fallidos ahora?" },
];

export function novaReply(prompt: string): NovaMessage {
  const trimmed = prompt.trim();
  const canned: Record<string, string> = {
    hola: "¡Hola! Soy CNM Nova. Puedo ayudarte a segmentar, optimizar campañas y analizar entregas.",
  };
  const key = trimmed.toLowerCase().split(" ")[0] ?? "";
  const answer =
    canned[key] ??
    `He analizado tu solicitud: "${trimmed.slice(0, 80)}". Sugiero programar el envío entre 10:00 y 12:00 hs a un segmento VIP de 4.820 contactos. ¿Genero el borrador?`;
  return { from: "nova", text: answer };
}

export const novaMock = { suggestions: () => NOVA_SUGGESTIONS, history: () => NOVA_HISTORY, reply: novaReply };
