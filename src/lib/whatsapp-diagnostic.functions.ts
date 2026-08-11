import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const testMetaConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !phoneNumberId || !businessAccountId) {
      return {
        success: false,
        error: "Faltan variables de entorno WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_BUSINESS_ACCOUNT_ID",
      };
    }

    const results: any = {
      PHONE_NUMBER: "ERROR",
      WABA: "ERROR",
      TEMPLATES: "ERROR",
      CNM_PRUEBA: "NO ENCONTRADA",
      raw_errors: [],
    };

    try {
      // 1. PHONE NUMBER INFO
      const phoneResponse = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const phoneData = await phoneResponse.json();
      if (phoneResponse.ok) {
        results.PHONE_NUMBER = "OK";
      } else {
        results.raw_errors.push(`PHONE: ${phoneData.error?.code} - ${phoneData.error?.message}`);
      }

      // 2. WABA INFO
      const wabaResponse = await fetch(`https://graph.facebook.com/v20.0/${businessAccountId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const wabaData = await wabaResponse.json();
      if (wabaResponse.ok) {
        results.WABA = "OK";
      } else {
        results.raw_errors.push(`WABA: ${wabaData.error?.code} - ${wabaData.error?.message}`);
      }

      // 3. TEMPLATES
      const templatesResponse = await fetch(
        `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates?limit=100`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const templatesData = await templatesResponse.json();
      if (templatesResponse.ok) {
        results.TEMPLATES = "OK";
        const found = templatesData.data?.some((t: any) => t.name === "cnm_prueba");
        if (found) {
          results.CNM_PRUEBA = "ENCONTRADA";
        }
      } else {
        results.raw_errors.push(`TEMPLATES: ${templatesData.error?.code} - ${templatesData.error?.message}`);
      }
    } catch (e: any) {
      results.raw_errors.push(`CRITICAL: ${e.message}`);
    }

    return results;
  });
