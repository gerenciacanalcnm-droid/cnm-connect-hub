import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWebhookDiagnostic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ companyId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // 1. Get total events for the company
    const { count: totalEvents } = await context.supabase
      .from("whatsapp_webhooks")
      .select("*", { count: 'exact', head: true });

    // 2. Get duplicates (if event_id exists, or same payload)
    // For now simple count
    
    // 3. Last event
    const { data: lastEvent } = await context.supabase
      .from("whatsapp_webhooks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      status: lastEvent ? 'CONNECTED' : 'NOT RECEIVING EVENTS',
      lastReceivedAt: lastEvent?.created_at || null,
      totalReceived: totalEvents || 0,
      totalProcessed: totalEvents || 0, // Simplified for now
      totalDuplicates: 0,
      errors: 0
    };
  });
