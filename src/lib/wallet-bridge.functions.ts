
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const uuid = z.string().uuid();

/**
 * Obtiene el saldo del Wallet financiero real para la empresa actual.
 * Centraliza la consulta para evitar duplicidad de saldos en WhatsApp.
 */
export const getMyCompanyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ channel: z.string().default("whatsapp") }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    // 1. Obtener el company_id del usuario (del perfil)
    const { data: profile, error: pErr } = await context.supabase
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .single();

    if (pErr || !profile?.company_id) {
      throw new Error("No se pudo identificar la empresa del usuario.");
    }

    const companyId = profile.company_id;

    // 2. Consultar el wallet específico para ese canal
    // El Wallet central pertenece al company_id
    const { data: wallet, error: wErr } = await context.supabase
      .from("wallets")
      .select("*")
      .eq("company_id", companyId)
      .eq("channel", data.channel)
      .maybeSingle();

    if (wErr) throw new Error(wErr.message);

    // Si no existe, devolvemos un estado vacío pero válido para el UI
    if (!wallet) {
      return {
        id: null,
        company_id: companyId,
        balance: 0,
        consumed: 0,
        credits: 0,
        currency: "COP",
        status: "inactive"
      };
    }

    return wallet;
  });
