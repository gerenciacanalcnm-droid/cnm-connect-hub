import type { ApiKey, Webhook, ApiLog } from "@/types/api-key";
import { id, pick, int, daysAgo, hoursAgo, minutesAgo, resetSeed } from "./seed";

export function buildApiKeysMock(): ApiKey[] {
  resetSeed(0xA9EE);
  return [
    { id: id("key"), name: "Producción · Backend", prefix: "cnm_live", masked: "cnm_live_****_a2b7c1", scopes: ["sms:send", "sms:read", "campaigns:*"], status: "active", lastUsedAt: minutesAgo(4), createdAt: daysAgo(120) },
    { id: id("key"), name: "Integración WhatsApp", prefix: "cnm_live", masked: "cnm_live_****_9f3e2d", scopes: ["sms:send"], status: "active", lastUsedAt: hoursAgo(2), createdAt: daysAgo(48) },
    { id: id("key"), name: "Ambiente staging", prefix: "cnm_test", masked: "cnm_test_****_71ab0c", scopes: ["*"], status: "active", lastUsedAt: daysAgo(1), createdAt: daysAgo(200) },
    { id: id("key"), name: "Vieja migración", prefix: "cnm_live", masked: "cnm_live_****_deprec", scopes: ["sms:read"], status: "revoked", createdAt: daysAgo(540) },
  ];
}

export function buildWebhooksMock(): Webhook[] {
  resetSeed(0xB007);
  return [
    { id: id("wh"), url: "https://api.miempresa.com/hooks/sms", events: ["sms.delivered", "sms.failed"], status: "active", lastDeliveryAt: minutesAgo(2), createdAt: daysAgo(90) },
    { id: id("wh"), url: "https://n8n.miempresa.com/webhook/cnm", events: ["campaign.completed"], status: "active", lastDeliveryAt: hoursAgo(6), createdAt: daysAgo(30) },
    { id: id("wh"), url: "https://legacy.example.com/cnm", events: ["*"], status: "failing", lastDeliveryAt: hoursAgo(48), createdAt: daysAgo(400) },
  ];
}

const PATHS = ["/v1/sms", "/v1/campaigns", "/v1/contacts", "/v1/analytics/summary", "/v1/webhooks"];
export function buildApiLogsMock(count = 80): ApiLog[] {
  resetSeed(0x106);
  return Array.from({ length: count }).map((_, i) => {
    const status = pick([200, 200, 200, 201, 400, 401, 429, 500]);
    return {
      id: id("log"),
      method: pick(["GET", "POST", "PUT", "DELETE"] as const),
      path: pick(PATHS),
      statusCode: status,
      latencyMs: int(28, 620),
      createdAt: minutesAgo(i * 2),
    };
  });
}

export const apiKeysMock = {
  keys: buildApiKeysMock,
  webhooks: buildWebhooksMock,
  logs: buildApiLogsMock,
};
