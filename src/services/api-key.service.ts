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
  key_prefix: string;
  scopes: string[];
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

type HookRow = {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  failure_count: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  created_at: string;
};

function mapKey(r: KeyRow): ApiKey {
  return {
    id: r.id,
    name: r.name,
    prefix: r.key_prefix,
    masked: `${r.key_prefix}••••••••`,
    scopes: r.scopes ?? [],
    status: r.revoked_at ? "revoked" : "active",
    lastUsedAt: r.last_used_at ?? undefined,
    createdAt: r.created_at,
  };
}

function mapHook(r: HookRow): Webhook {
  let status: Webhook["status"] = "active";
  if (!r.is_active) status = "paused";
  else if (r.failure_count > 3) status = "failing";
  return {
    id: r.id,
    url: r.url,
    events: r.events ?? [],
    status,
    lastDeliveryAt: r.last_success_at ?? r.last_failure_at ?? undefined,
    createdAt: r.created_at,
  };
}

export interface ApiKeyService {
  listKeys(): Promise<ApiKey[]>;
  createKey(input: { name: string; scopes: string[] }): Promise<ApiKey & { plainSecret: string }>;
  revokeKey(id: string): Promise<void>;
  listWebhooks(): Promise<Webhook[]>;
  createWebhook(input: { url: string; events: string[]; name?: string }): Promise<Webhook>;
  removeWebhook(id: string): Promise<void>;
  logs(): Promise<ApiLog[]>;
}

export const apiKeyService: ApiKeyService = {
  async listKeys() {
    try {
      const rows = (await listApiKeys()) as unknown as KeyRow[];
      return rows.map(mapKey);
    } catch (err) {
      console.error("[apiKeyService] listKeys:", err);
      return [];
    }
  },
  async createKey(input) {
    const res = (await createApiKey({ data: input })) as unknown as { row: KeyRow; secret: string };
    return { ...mapKey(res.row), plainSecret: res.secret };
  },
  async revokeKey(id) {
    await revokeApiKey({ data: { id } });
  },
  async listWebhooks() {
    try {
      const rows = (await listWebhooks()) as unknown as HookRow[];
      return rows.map(mapHook);
    } catch (err) {
      console.error("[apiKeyService] listWebhooks:", err);
      return [];
    }
  },
  async createWebhook(input) {
    const row = (await upsertWebhook({
      data: {
        input: {
          name: input.name ?? new URL(input.url).hostname,
          url: input.url,
          events: input.events,
          is_active: true,
        },
      },
    })) as unknown as HookRow;
    return mapHook(row);
  },
  async removeWebhook(id) {
    await deleteWebhook({ data: { id } });
  },
  async logs() {
    return [];
  },
};
