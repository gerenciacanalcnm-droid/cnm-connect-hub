import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Diagnostic function to verify connection with Meta Cloud API.
 * 
 * Rules:
 * 1. Do not expose WHATSAPP_ACCESS_TOKEN.
 * 2. Only return secure diagnostic information.
 */
export const testMetaConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Read secrets inside handler
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !phoneNumberId || !businessAccountId) {
      return {
        success: false,
        error: "Faltan variables de entorno WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_BUSINESS_ACCOUNT_ID",
      };
    }

    const results: {
      PHONE_NUMBER: string;
      WABA: string;
      TEMPLATES: string;
      CNM_PRUEBA: string;
      raw_errors: string[];
    } = {
      PHONE_NUMBER: "ERROR",
      WABA: "ERROR",
      TEMPLATES: "ERROR",
      CNM_PRUEBA: "NO ENCONTRADA",
      raw_errors: [],
    };

    try {
      // PRUEBA 1: PHONE NUMBER INFO
      const phoneResponse = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
      });
      
      if (phoneResponse.ok) {
        results.PHONE_NUMBER = "OK";
      } else {
        const errData = await phoneResponse.json().catch(() => ({}));
        results.raw_errors.push(`PHONE [${phoneResponse.status}]: ${errData.error?.code || 'N/A'} - ${errData.error?.message || 'Unknown'}`);
      }

      // PRUEBA 2: WABA INFO
      const wabaResponse = await fetch(`https://graph.facebook.com/v20.0/${businessAccountId}`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
      });
      
      if (wabaResponse.ok) {
        results.WABA = "OK";
      } else {
        const errData = await wabaResponse.json().catch(() => ({}));
        results.raw_errors.push(`WABA [${wabaResponse.status}]: ${errData.error?.code || 'N/A'} - ${errData.error?.message || 'Unknown'}`);
      }

      // PRUEBA 3: TEMPLATES
      const templatesResponse = await fetch(
        `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates?limit=100`,
        {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
        }
      );
      
      if (templatesResponse.ok) {
        results.TEMPLATES = "OK";
        const templatesData = await templatesResponse.json();
        const found = templatesData.data?.some((t: any) => t.name === "cnm_prueba");
        if (found) {
          results.CNM_PRUEBA = "ENCONTRADA";
        }
      } else {
        const errData = await templatesResponse.json().catch(() => ({}));
        results.raw_errors.push(`TEMPLATES [${templatesResponse.status}]: ${errData.error?.code || 'N/A'} - ${errData.error?.message || 'Unknown'}`);
      }
    } catch (e: any) {
      results.raw_errors.push(`CRITICAL_FETCH: ${e.message}`);
    }

    return results;
  });
