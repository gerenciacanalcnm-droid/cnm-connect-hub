import type { ApiKey, Webhook, ApiLog } from "@/types/api-key";
import { apiKeysMock } from "./mocks/api-keys.mock";
import { id } from "./mocks/seed";

const KEYS: ApiKey[] = apiKeysMock.keys();
const HOOKS: Webhook[] = apiKeysMock.webhooks();
const LOGS: ApiLog[] = apiKeysMock.logs();

export interface ApiKeyService {
  listKeys(): Promise<ApiKey[]>;
  createKey(input: { name: string; scopes: string[] }): Promise<ApiKey & { plainSecret: string }>;
  revokeKey(id: string): Promise<void>;
  listWebhooks(): Promise<Webhook[]>;
  createWebhook(input: { url: string; events: string[] }): Promise<Webhook>;
  removeWebhook(id: string): Promise<void>;
  logs(): Promise<ApiLog[]>;
}

export const apiKeyService: ApiKeyService = {
  async listKeys() {
    return KEYS;
  },
  async createKey({ name, scopes }) {
    const secret = `cnm_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const item: ApiKey = {
      id: id("key"),
      name,
      prefix: "cnm_live",
      masked: `cnm_live_****_${secret.slice(-6)}`,
      scopes,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    KEYS.unshift(item);
    return { ...item, plainSecret: secret };
  },
  async revokeKey(kid) {
    const k = KEYS.find((x) => x.id === kid);
    if (k) k.status = "revoked";
  },
  async listWebhooks() {
    return HOOKS;
  },
  async createWebhook(input) {
    const item: Webhook = {
      id: id("wh"),
      url: input.url,
      events: input.events,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    HOOKS.unshift(item);
    return item;
  },
  async removeWebhook(wid) {
    const i = HOOKS.findIndex((x) => x.id === wid);
    if (i >= 0) HOOKS.splice(i, 1);
  },
  async logs() {
    return LOGS;
  },
};
