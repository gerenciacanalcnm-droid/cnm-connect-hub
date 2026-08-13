// Cliente de navegador apuntando al proyecto Supabase propio.
// Sustituye a `client.ts` (autogenerado) vía alias en tsconfig.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  createSupabaseFetch,
} from "@/config/supabase.runtime";

function createSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
