/**
 * Punto único de configuración de conexión a Supabase.
 *
 * Este proyecto apunta al proyecto Supabase propio (restaurado y verificado),
 * NO al backend gestionado. La publishable key es pública por diseño.
 *
 * Prioridad: variables de entorno propias (no reservadas) → valores por defecto.
 */
const envUrl =
  (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SB_URL : undefined) ||
  (typeof process !== "undefined" ? process.env?.SB_URL : undefined);

const envKey =
  (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SB_PUBLISHABLE_KEY : undefined) ||
  (typeof process !== "undefined" ? process.env?.SB_PUBLISHABLE_KEY : undefined);

export const SUPABASE_URL = envUrl || "https://ngocyhzburhatiegdctn.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  envKey || "sb_publishable_YFtdwElMnIzQmwcBSCegnQ_erV1VFfP";

export const SUPABASE_PROJECT_REF = "ngocyhzburhatiegdctn";

/**
 * Secret key (service role) del NUEVO proyecto.
 * Aún no disponible: las operaciones administrativas quedan deshabilitadas
 * de forma explícita en `client.server.custom.ts` hasta que se aporte.
 */
export const SUPABASE_SECRET_KEY =
  typeof process !== "undefined" ? process.env?.SB_SECRET_KEY : undefined;

export function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/** Las nuevas API keys son cadenas opacas, no JWT bearer. */
export function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}
