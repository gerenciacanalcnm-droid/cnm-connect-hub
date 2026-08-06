/**
 * SMS CNM — API Client Enterprise
 *
 * Preparado para conectar a Backend real. Incluye:
 *   - Métodos GET / POST / PUT / PATCH / DELETE
 *   - Interceptors (request / response)
 *   - Headers dinámicos
 *   - Auth (Bearer token provider)
 *   - Timeout configurable
 *   - Retry con backoff exponencial
 *   - Error handler tipado
 *   - Response parser JSON
 *
 * NOTA: No se conecta a ningún backend aún. Estructura lista.
 */
import { apiConfig } from "@/config/api.config";
import { ApiError, AuthError, NetworkError, PermissionError } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestConfig = Omit<RequestInit, "body" | "method"> & {
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
  retries?: number;
  params?: Record<string, string | number | boolean | undefined>;
};

export type RequestInterceptor = (
  url: string,
  init: RequestInit,
) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };

export type ResponseInterceptor = (res: Response) => Promise<Response> | Response;

type TokenProvider = () => string | null | Promise<string | null>;

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private tokenProvider: TokenProvider = () => null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor() {
    this.baseURL = apiConfig.baseURL;
    this.defaultTimeout = apiConfig.timeoutMs;
    this.defaultRetries = apiConfig.retries;
  }

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  setTokenProvider(fn: TokenProvider) {
    this.tokenProvider = fn;
  }

  useRequestInterceptor(fn: RequestInterceptor) {
    this.requestInterceptors.push(fn);
  }

  useResponseInterceptor(fn: ResponseInterceptor) {
    this.responseInterceptors.push(fn);
  }

  get<T>(path: string, cfg?: RequestConfig) {
    return this.request<T>("GET", path, cfg);
  }
  post<T>(path: string, body?: unknown, cfg?: RequestConfig) {
    return this.request<T>("POST", path, { ...cfg, body });
  }
  put<T>(path: string, body?: unknown, cfg?: RequestConfig) {
    return this.request<T>("PUT", path, { ...cfg, body });
  }
  patch<T>(path: string, body?: unknown, cfg?: RequestConfig) {
    return this.request<T>("PATCH", path, { ...cfg, body });
  }
  delete<T>(path: string, cfg?: RequestConfig) {
    return this.request<T>("DELETE", path, cfg);
  }

  private buildURL(path: string, params?: RequestConfig["params"]) {
    const base = path.startsWith("http") ? path : `${this.baseURL}${path}`;
    if (!params) return base;
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
  }

  private async request<T>(method: HttpMethod, path: string, cfg: RequestConfig = {}): Promise<T> {
    const {
      body,
      auth = true,
      timeoutMs = this.defaultTimeout,
      retries = this.defaultRetries,
      params,
      headers,
      ...rest
    } = cfg;

    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string> | undefined),
    };

    if (auth) {
      const token = await this.tokenProvider();
      if (token) finalHeaders.Authorization = `Bearer ${token}`;
    }

    let url = this.buildURL(path, params);
    let init: RequestInit = {
      ...rest,
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    for (const ic of this.requestInterceptors) {
      const out = await ic(url, init);
      url = out.url;
      init = out.init;
    }

    let attempt = 0;
    // Retry loop with exponential backoff for network/5xx errors.
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        let res = await fetch(url, { ...init, signal: controller.signal });
        for (const ic of this.responseInterceptors) res = await ic(res);
        clearTimeout(timer);

        if (!res.ok) {
          const payload = await this.safeJson(res);
          const message =
            (payload && (payload.message as string)) || res.statusText || "Request failed";
          if (res.status === 401) throw new AuthError(message, res.status, payload);
          if (res.status === 403) throw new PermissionError(message, payload);
          if (res.status >= 500 && attempt < retries) {
            attempt++;
            await this.backoff(attempt);
            continue;
          }
          throw new ApiError(message, res.status, "api_error", payload);
        }

        if (res.status === 204) return undefined as T;
        return (await res.json()) as T;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof ApiError || err instanceof AuthError || err instanceof PermissionError) {
          throw err;
        }
        if (attempt < retries) {
          attempt++;
          await this.backoff(attempt);
          continue;
        }
        throw new NetworkError((err as Error)?.message ?? "Network failure", err);
      }
    }
  }

  private async safeJson(res: Response): Promise<Record<string, unknown> | null> {
    try {
      return (await res.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private backoff(attempt: number) {
    const ms = Math.min(1000 * 2 ** (attempt - 1), 8000);
    return new Promise((r) => setTimeout(r, ms));
  }
}

export const apiClient = new ApiClient();
export type { ApiClient };
