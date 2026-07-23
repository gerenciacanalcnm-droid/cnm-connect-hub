import type { ID } from "./common";

export interface ApiKey {
  id: ID;
  name: string;
  prefix: string;
  masked: string;
  scopes: string[];
  status: "active" | "revoked";
  lastUsedAt?: string;
  createdAt: string;
}

export interface Webhook {
  id: ID;
  url: string;
  events: string[];
  status: "active" | "paused" | "failing";
  lastDeliveryAt?: string;
  createdAt: string;
}

export interface ApiLog {
  id: ID;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  statusCode: number;
  latencyMs: number;
  createdAt: string;
}
