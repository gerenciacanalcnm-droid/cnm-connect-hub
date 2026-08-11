
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
    // 1. Obtener el company_id del usuario (de company_members)
    const { data: membership, error: mErr } = await context.supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (mErr || !membership?.company_id) {
      throw new Error("No se pudo identificar la empresa del usuario o no tiene una empresa activa asignada.");
    }

    const companyId = membership.company_id;

    // 2. Consultar el wallet específico para ese canal
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
