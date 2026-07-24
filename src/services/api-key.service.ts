import type { ApiKey, Webhook, ApiLog } from "@/types/api-key";

const NOT_CONNECTED = new Error("Próximamente: las claves de API se conectarán en la siguiente fase.");

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
  async listKeys() { return []; },
  async createKey() { throw NOT_CONNECTED; },
  async revokeKey() { throw NOT_CONNECTED; },
  async listWebhooks() { return []; },
  async createWebhook() { throw NOT_CONNECTED; },
  async removeWebhook() { throw NOT_CONNECTED; },
  async logs() { return []; },
};
