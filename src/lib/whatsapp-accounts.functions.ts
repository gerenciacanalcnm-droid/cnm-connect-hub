import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { testMetaConnection } from "./whatsapp-diagnostic.functions";
import { getMetaTemplatesDetail } from "./whatsapp-diagnostic-detail.functions";
import { z } from "zod";

/**
 * Validates a single WhatsApp account's connection using its stored or provided credentials.
 */
export const testSpecificAccountConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ accountId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { accountId } = data;
    
    // 1. Get account details including tokens
    const { data: account, error } = await context.supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("id", accountId)
      .single();
      
    if (error || !account) throw new Error("Account not found");
    
    // Check if we have access to tokens via Data API
    let token = account.access_token;
    if (!token) {
       const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
       const { data: adminAccount } = await supabaseAdmin
         .from("whatsapp_accounts")
         .select("access_token")
         .eq("id", accountId)
         .single();
       
       if (adminAccount) {
         token = adminAccount.access_token;
       }
    }

    if (!token) throw new Error("Access token not available for diagnostic");

    // Temporarily override process.env to reuse existing diagnostic functions
    const oldToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const oldPhone = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const oldWaba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    
    process.env.WHATSAPP_ACCESS_TOKEN = token;
    process.env.WHATSAPP_PHONE_NUMBER_ID = account.phone_number_id ?? "";
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = account.business_account_id ?? "";
    
    try {
      const basic = await testMetaConnection();
      const detailed = await getMetaTemplatesDetail();
      
      return { basic, detailed };
    } finally {
      process.env.WHATSAPP_ACCESS_TOKEN = oldToken;
      process.env.WHATSAPP_PHONE_NUMBER_ID = oldPhone;
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = oldWaba;
    }
  });
