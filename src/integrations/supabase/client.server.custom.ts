// Cliente administrativo (service role) del proyecto propio.
// Sustituye a `client.server.ts` (autogenerado) vía alias en tsconfig.
//
// ESTADO: PENDIENTE. Todavía no disponemos de la secret key del nuevo proyecto,
// por lo que este cliente falla de forma explícita en lugar de escribir por error
// en el backend anterior. En cuanto exista `SB_SECRET_KEY` en el entorno del
// servidor, este módulo funciona sin más cambios.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  createSupabaseFetch,
} from "@/config/supabase.runtime";

export const ADMIN_UNAVAILABLE_MESSAGE =
  "Operación administrativa no disponible: falta SB_SECRET_KEY del proyecto Supabase propio (ngocyhzburhatiegdctn). Configúrala como secreto de servidor para habilitar el cliente service role.";

function createSupabaseAdminClient() {
  const secret = SUPABASE_SECRET_KEY;
  if (!secret) {
    console.error(`[Supabase] ${ADMIN_UNAVAILABLE_MESSAGE}`);
    throw new Error(ADMIN_UNAVAILABLE_MESSAGE);
  }

  return createClient<Database>(SUPABASE_URL, secret, {
    global: { fetch: createSupabaseFetch(secret) },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
