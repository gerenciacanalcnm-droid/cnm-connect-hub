/**
 * Configuración del API Client. Reemplazable por variables de entorno o
 * por el Panel del Super Administrador en producción.
 */
const env =
  (typeof import.meta !== "undefined"
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {}) ?? {};

export const apiConfig = {
  baseURL: env.VITE_API_URL ?? "/api",
  timeoutMs: 15_000,
  retries: 2,
  version: "v1",
} as const;

export type ApiConfig = typeof apiConfig;
