import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWhatsAppCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ companyId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: campaigns, error } = await context.supabase
      .from("whatsapp_campaigns")
      .select(`
        *,
        whatsapp_templates (name),
        whatsapp_accounts (alias, display_phone)
      `)
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return campaigns;
  });

export const createWhatsAppCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    companyId: z.string().uuid(),
    accountId: z.string().uuid(),
    templateId: z.string().uuid().optional(),
    name: z.string().min(3),
    scheduledAt: z.string().optional(),
    recipients: z.array(z.object({
      phone: z.string(),
      contactId: z.string().uuid().optional(),
      variables: z.record(z.string()).optional()
    })),
    estimatedCost: z.number()
  }).parse(v))
  .handler(async ({ data, context }) => {
    // 1. Create campaign record
    const { data: campaign, error: campaignError } = await context.supabase
      .from("whatsapp_campaigns")
      .insert({
        company_id: data.companyId,
        account_id: data.accountId,
        template_id: data.templateId,
        name: data.name,
        status: data.scheduledAt ? 'SCHEDULED' : 'QUEUED',
        scheduled_at: data.scheduledAt,
        total_recipients: data.recipients.length,
        estimated_cost: data.estimatedCost,
        created_by: context.userId
      })
      .select()
      .single();

    if (campaignError) throw new Error(campaignError.message);

    // 2. Insert results/queue entries
    const results = data.recipients.map(r => ({
      campaign_id: campaign.id,
      phone: r.phone,
      contact_id: r.contactId,
      status: 'queued' as const,
      metadata: { variables: r.variables }
    }));

    const { error: resultsError } = await context.supabase
      .from("whatsapp_campaign_results")
      .insert(results);

    if (resultsError) {
      // Rollback campaign if queue fails? 
      // For now just throw, Supabase transactions are implicit in single-query but not across
      throw new Error(resultsError.message);
    }

    return campaign;
  });

export const getWhatsAppCampaignDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ campaignId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: campaign, error: campaignError } = await context.supabase
      .from("whatsapp_campaigns")
      .select(`
        *,
        whatsapp_templates (*),
        whatsapp_accounts (*)
      `)
      .eq("id", data.campaignId)
      .single();

    if (campaignError) throw new Error(campaignError.message);

    const { data: results, error: resultsError } = await context.supabase
      .from("whatsapp_campaign_results")
      .select("*")
      .eq("campaign_id", data.campaignId)
      .limit(100); // Pagination needed for real production

    if (resultsError) throw new Error(resultsError.message);

    return { campaign, results };
  });
