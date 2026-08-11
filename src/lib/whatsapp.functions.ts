import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { trackServiceUsage } from "./commercial.functions";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

/**
 * WhatsApp Business - Meta Cloud API Integration
 * Multi-tenant creds storage and connection testing.
 */

export const testWhatsAppConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      businessAccountId: z.string().min(1),
      phoneNumberId: z.string().min(1),
      accessToken: z.string().min(1),
    }).parse(v)
  )
  .handler(async ({ data }) => {
    try {
      // Intentamos llamar al endpoint de Phone Number ID para validar el token y los IDs
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${data.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Error de validación con Meta");
      }

      // Verificamos que el Business Account ID coincida si viene en la respuesta
      // O simplemente validamos que la respuesta es exitosa
      return { 
        ok: true, 
        verifiedName: result.verified_name,
        displayPhoneNumber: result.display_phone_number
      };
    } catch (err: any) {
      console.error("[whatsapp.server] testWhatsAppConnection:", err.message);
      return { ok: false, error: err.message };
    }
  });

export const saveWhatsAppCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      accountId: z.string().uuid().optional(),
      alias: z.string().min(1),
      businessAccountId: z.string().min(1),
      phoneNumberId: z.string().min(1),
      accessToken: z.string().min(1),
      webhookVerifyToken: z.string().optional(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 1. Validar conexión antes de guardar como activo
    const test = await testWhatsAppConnection({ 
      data: {
        businessAccountId: data.businessAccountId,
        phoneNumberId: data.phoneNumberId,
        accessToken: data.accessToken
      }
    });

    if (!test.ok) {
      throw new Error("No fue posible conectar WhatsApp: Credenciales inválidas");
    }

    // 2. Upsert en whatsapp_accounts
    // El Access Token se guarda en la DB (RLS protege el acceso)
    // En producción real, esto podría ir a un vault externo.
    const row = {
      company_id: CNM_COMPANY_ID,
      alias: data.alias,
      provider: "meta",
      business_account_id: data.businessAccountId,
      phone_number_id: data.phoneNumberId,
      access_token: data.accessToken,
      webhook_verify_token: data.webhookVerifyToken || crypto.randomUUID(),
      status: "connected" as const,
      display_phone: test.displayPhoneNumber || null,
      verified_name: test.verifiedName || null,
      last_synced_at: new Date().toISOString(),
    };

    const { error } = data.accountId 
      ? await context.supabase.from("whatsapp_accounts").update(row).eq("id", data.accountId)
      : await context.supabase.from("whatsapp_accounts").insert(row);

    if (error) throw new Error(error.message);

    return { ok: true };
  });
