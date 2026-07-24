import type { ApiKey, Webhook, ApiLog } from "@/types/api-key";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  listWebhooks,
  upsertWebhook,
  deleteWebhook,
} from "@/lib/platform.functions";

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: string;
  last_used_at: string | null;
  created_at: string;
};

type HookRow = {
  id: string;
  url: string;
  events: string[];
  status: string;
  last_delivery_at?: string | null;
  created_at: string;
};

function mapKey(r: KeyRow): ApiKey {
  return {
    id: r.id,
    name: r.name,
    prefix: r.prefix,
    masked: `${r.prefix}••••••••`,
    scopes: r.scopes ?? [],
    status: (r.status as ApiKey["status"]) ?? "active",
    lastUsedAt: r.last_used_at ?? undefined,
    createdAt: r.created_at,
  };
}

function mapHook(r: HookRow): Webhook {
  return {
    id: r.id,
    url: r.url,
    events: r.events ?? [],
    status: (r.status as Webhook["status"]) ?? "active",
    lastDeliveryAt: r.last_delivery_at ?? undefined,
    createdAt: r.created_at,
  };
}

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
    try {
      const rows = (await listApiKeys()) as KeyRow[];
      return rows.map(mapKey);
    } catch (err) {
      console.error("[apiKeyService] listKeys:", err);
      return [];
    }
  },
  async createKey(input) {
    const res = (await createApiKey({ data: input })) as {
      row: KeyRow;
      plain_secret: string;
    };
    return { ...mapKey(res.row), plainSecret: res.plain_secret };
  },
  async revokeKey(id) {
    await revokeApiKey({ data: { id } });
  },
  async listWebhooks() {
    try {
      const rows = (await listWebhooks()) as HookRow[];
      return rows.map(mapHook);
    } catch (err) {
      console.error("[apiKeyService] listWebhooks:", err);
      return [];
    }
  },
  async createWebhook(input) {
    const row = (await upsertWebhook({ data: input })) as HookRow;
    return mapHook(row);
  },
  async removeWebhook(id) {
    await deleteWebhook({ data: { id } });
  },
  async logs() {
    return [];
  },
};
