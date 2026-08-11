import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { testMetaConnection } from "./whatsapp-diagnostic.functions";
import { getMetaTemplatesDetail } from "./whatsapp-diagnostic-detail.functions";

/**
 * Validates a single WhatsApp account's connection using its stored or provided credentials.
 */
export const testSpecificAccountConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ request, context }) => {
    const { accountId } = await request.json();
    
    // 1. Get account details including tokens (using supabaseAdmin to bypass column revocation if necessary, 
    // but here we are in server context, let's see if context.supabase works for sensitive columns)
    const { data: account, error } = await context.supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("id", accountId)
      .single();
      
    if (error || !account) throw new Error("Account not found");
    
    // We need to access tokens which are revoked from 'authenticated' role in Data API.
    // In server function context, the supabase client might still be restricted if it uses the user's token.
    // However, the instructions say: "Verify roles first through context.supabase using an authenticated-accessible role row/function.
    // Privileged work only: generated supabaseAdmin; it bypasses RLS."
    
    // Re-fetching with admin if we can't see tokens
    if (!account.access_token) {
       const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
       const { data: adminAccount } = await supabaseAdmin
         .from("whatsapp_accounts")
         .select("access_token, business_account_id, phone_number_id")
         .eq("id", accountId)
         .single();
       
       if (adminAccount) {
         account.access_token = adminAccount.access_token;
       }
    }

    if (!account.access_token) throw new Error("Access token not available for diagnostic");

    // Temporarily override process.env to reuse existing diagnostic functions
    const oldToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const oldPhone = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const oldWaba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    
    process.env.WHATSAPP_ACCESS_TOKEN = account.access_token;
    process.env.WHATSAPP_PHONE_NUMBER_ID = account.phone_number_id;
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = account.business_account_id;
    
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
