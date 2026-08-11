import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Detailed diagnostic to list templates and verify WABA/Phone ID relationship.
 */
export const getMetaTemplatesDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !phoneNumberId || !businessAccountId) {
      return {
        success: false,
        error: "Missing Meta environment variables.",
      };
    }

    const report: any = {
      config: {
        phoneNumberId,
        businessAccountId,
      },
      phone_details: null,
      waba_details: null,
      waba_phone_numbers: [],
      templates: [],
      cnm_prueba_match: null,
      errors: [],
    };

    try {
      // 1. Verify Phone Number Details
      const phoneRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,status,code_verification_status,whatsapp_business_account`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const phoneData = await phoneRes.json();
      if (phoneRes.ok) {
        report.phone_details = phoneData;
      } else {
        report.errors.push(`Phone API: ${phoneData.error?.message}`);
      }

      // 2. List WABA Phone Numbers to check membership correctly
      const phoneNumbersRes = await fetch(`https://graph.facebook.com/v20.0/${businessAccountId}/phone_numbers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const phoneNumbersData = await phoneNumbersRes.json();
      if (phoneNumbersRes.ok) {
        report.waba_phone_numbers = phoneNumbersData.data || [];
      } else {
        report.errors.push(`WABA Phone Numbers API: ${phoneNumbersData.error?.message}`);
      }

      // 2. Verify WABA Details
      const wabaRes = await fetch(`https://graph.facebook.com/v20.0/${businessAccountId}?fields=id,name,timezone_id`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const wabaData = await wabaRes.json();
      if (wabaRes.ok) {
        report.waba_details = wabaData;
      } else {
        report.errors.push(`WABA API: ${wabaData.error?.message}`);
      }

      // 4. List all templates
      const templatesRes = await fetch(
        `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates?limit=500&fields=id,name,language,status,category`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const templatesData = await templatesRes.json();
      if (templatesRes.ok) {
        report.templates = (templatesData.data || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          language: t.language,
          status: t.status,
          category: t.category,
        }));

        // Search for cnm_prueba (case insensitive check just in case)
        const match = report.templates.find((t: any) => t.name.toLowerCase() === "cnm_prueba");
        if (match) {
          report.cnm_prueba_match = match;
        }
      } else {
        report.errors.push(`Templates API: ${templatesData.error?.message}`);
      }
    } catch (e: any) {
      report.errors.push(`System Error: ${e.message}`);
    }

    return report;
  });
