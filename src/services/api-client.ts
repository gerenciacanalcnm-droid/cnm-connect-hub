/**
 * SMS CNM — API Client
 *
 * Fetch wrapper preparado para:
 *   - REST API
 *   - JWT (Authorization: Bearer <token>)
 *   - Google OAuth (intercambio de token)
 *   - Manejo unificado de errores
 *
 * NOTA: Implementación de lógica pendiente. Solo arquitectura.
 */

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

const BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL) ||
  "/api";

let authTokenProvider: () => string | null = () => null;

export function configureAuthTokenProvider(fn: () => string | null) {
  authTokenProvider = fn;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = authTokenProvider();
    if (token) (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let payload: Partial<ApiError> = {};
    try {
      payload = await res.json();
    } catch {
      /* noop */
    }
    throw {
      status: res.status,
      code: payload.code ?? "unknown_error",
      message: payload.message ?? res.statusText,
      details: payload.details,
    } satisfies ApiError;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};
