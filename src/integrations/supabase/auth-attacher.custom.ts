// Adjunta el bearer token del proyecto Supabase propio a cada llamada de server function.
// Reemplaza a `auth-attacher.ts` (autogenerado), que importa el cliente antiguo por ruta relativa.
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
