import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Fetch all managed WhatsApp numbers (Admin only).
 */
export const getInventoryNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. Verify admin role
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'super_admin' 
    });

    if (!isAdmin) throw new Error("Unauthorized: Only super admins can access inventory");

    // 2. Fetch inventory
    // We join with companies to get the assigned company name
    const { data, error } = await context.supabase
      .from("whatsapp_accounts")
      .select(`
        *,
        companies (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });

/**
 * Assign a number to a company (Admin only).
 */
export const assignNumberToCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => 
    z.object({ 
      accountId: z.string().uuid(),
      companyId: z.string().uuid() 
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // The RPC handle_whatsapp_assignment takes care of admin check, atomicity, and logging
    const { error } = await supabaseAdmin.rpc("assign_whatsapp_account", {
      _account_id: data.accountId,
      _company_id: data.companyId,
      _admin_id: context.userId
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

/**
 * Unassign a number (Admin only).
 */
export const unassignNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ accountId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.rpc("unassign_whatsapp_account", {
      _account_id: data.accountId,
      _admin_id: context.userId
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

/**
 * Get assignment audit logs (Admin only).
 */
export const getAssignmentAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ accountId: z.string().uuid().optional().nullable() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'super_admin' 
    });

    if (!isAdmin) throw new Error("Unauthorized");

    let query = context.supabase
      .from("whatsapp_assignment_audit")
      .select(`
        *,
        whatsapp_accounts (alias, phone_number),
        old_company:companies!old_company_id (name),
        new_company:companies!new_company_id (name)
      `)
      .order("created_at", { ascending: false });

    if (data.accountId) {
      query = query.eq("account_id", data.accountId);
    }

    const { data: audits, error } = await query;
    if (error) throw new Error(error.message);
    return audits;
  });

