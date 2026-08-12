import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Get commercial profile for a company (Admin only).
 */
export const getCompanyWhatsAppProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ companyId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // 1. Verify admin role
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'super_admin' 
    });

    if (!isAdmin) throw new Error("Unauthorized");

    // 2. Fetch basic data
    const { data: company, error: companyError } = await context.supabase
      .from("companies")
      .select("id, name, balance")
      .eq("id", data.companyId)
      .single();

    if (companyError) throw new Error(companyError.message);

    // 3. Fetch assigned accounts
    const { data: accounts, error: accountsError } = await context.supabase
      .from("whatsapp_accounts")
      .select("id, alias, phone_number, is_default, nova_status")
      .eq("company_id", data.companyId);

    if (accountsError) throw new Error(accountsError.message);

    // 4. Fetch limits (using casting to bypass initial type mismatch until types update)
    const { data: limits } = await (context.supabase as any)
      .from("whatsapp_limits")
      .select("*")
      .eq("company_id", data.companyId)
      .maybeSingle();

    // 5. Aggregate basic message stats
    const { data: stats, error: statsError } = await context.supabase
      .from("whatsapp_messages")
      .select("status, metadata")
      .eq("company_id", data.companyId);

    if (statsError) throw new Error(statsError.message);

    const sent = stats.length;
    const successful = stats.filter(s => ['delivered', 'read', 'sent'].includes(s.status as string)).length;
    const failed = stats.filter(s => ['failed', 'undelivered'].includes(s.status as string)).length;

    // 6. Calculate total consumption
    const totalCost = stats.reduce((acc, curr: any) => {
      const metadata = typeof curr.metadata === 'string' ? JSON.parse(curr.metadata) : curr.metadata;
      return acc + (metadata?.cost || 0);
    }, 0);

    return {
      company: {
        id: company.id,
        name: company.name,
        balance: company.balance
      },
      accounts: (accounts || []).map(a => ({
        id: a.id,
        alias: a.alias,
        phoneNumber: a.phone_number,
        isDefault: a.is_default,
        novaStatus: a.nova_status
      })),
      limits: (limits as any) || { is_active: false },
      stats: {
        sent,
        successful,
        failed,
        totalCost
      }
    };
  });

/**
 * Update WhatsApp limits for a company (Admin only).
 */
export const updateWhatsAppLimits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => 
    z.object({ 
      companyId: z.string().uuid(),
      monthlyLimit: z.number().nullable(),
      dailyLimit: z.number().nullable(),
      hourlyLimit: z.number().nullable(),
      campaignLimit: z.number().nullable(),
      isActive: z.boolean()
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'super_admin' 
    });
    if (!isAdmin) throw new Error("Unauthorized");

    const { error } = await (supabaseAdmin as any)
      .from("whatsapp_limits")
      .upsert({
        company_id: data.companyId,
        monthly_limit: data.monthlyLimit,
        daily_limit: data.dailyLimit,
        hourly_limit: data.hourlyLimit,
        campaign_limit: data.campaignLimit,
        is_active: data.isActive,
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id' });

    if (error) throw new Error(error.message);
    return { success: true };
  });

/**
 * Get detailed consumption stats (Admin/Member).
 */
export const getWhatsAppConsumptionStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ 
    companyId: z.string().uuid(),
    period: z.enum(['today', 'week', 'month', 'historical']).default('month')
  }).parse(v))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("whatsapp_messages")
      .select("metadata, created_at")
      .eq("company_id", data.companyId);

    const now = new Date();
    if (data.period === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      query = query.gte("created_at", startOfDay);
    } else if (data.period === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      query = query.gte("created_at", startOfWeek);
    } else if (data.period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte("created_at", startOfMonth);
    }

    const { data: messages, error } = await query;
    if (error) throw new Error(error.message);

    // consumption_type is being added by migration, using any to bypass initial check
    const byType = {
      individual: messages.filter((m: any) => (m.consumption_type || 'individual') === 'individual').length,
      bulk: messages.filter((m: any) => m.consumption_type === 'bulk').length,
      campaign: messages.filter((m: any) => m.consumption_type === 'campaign').length,
      automation: messages.filter((m: any) => m.consumption_type === 'automation').length,
    };

    const cost = messages.reduce((acc, curr: any) => {
      const metadata = typeof curr.metadata === 'string' ? JSON.parse(curr.metadata) : curr.metadata;
      return acc + (metadata?.cost || 0);
    }, 0);

    return {
      total: messages.length,
      byType,
      cost
    };
  });

/**
 * Check WhatsApp limits for a company (Server-side, respects RLS/Auth).
 */
export const checkWhatsAppLimits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ companyId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // Note: The RPC check_whatsapp_limits is SECURITY DEFINER but we restricted EXECUTE to service_role.
    // Here we use supabaseAdmin to call it securely from the server.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: limitCheck, error: rpcError } = await (supabaseAdmin as any).rpc('check_whatsapp_limits', {
      _company_id: data.companyId
    });

    if (rpcError) throw new Error(rpcError.message);
    return limitCheck;
  });

