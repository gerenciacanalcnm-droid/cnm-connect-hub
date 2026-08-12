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
 * Set a number as default for its company (Admin only).
 */
export const setNumberAsDefault = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ 
    accountId: z.string().uuid(),
    companyId: z.string().uuid()
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'super_admin' 
    });
    if (!isAdmin) throw new Error("Unauthorized");

    // Atomic update: remove default from others in same company, set this one
    const { error: resetError } = await supabaseAdmin
      .from("whatsapp_accounts")
      .update({ is_default: false })
      .eq("company_id", data.companyId);

    if (resetError) throw new Error(resetError.message);

    const { error: setError } = await supabaseAdmin
      .from("whatsapp_accounts")
      .update({ is_default: true })
      .eq("id", data.accountId);

    if (setError) throw new Error(setError.message);

    return { success: true };
  });

/**
 * Update Nova status (Admin only).
 */
export const updateNovaStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ 
    accountId: z.string().uuid(),
    status: z.enum(["AVAILABLE", "ASSIGNED", "DISCONNECTED", "ERROR", "DISABLED"])
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'super_admin' 
    });
    if (!isAdmin) throw new Error("Unauthorized");

    const { error } = await supabaseAdmin
      .from("whatsapp_accounts")
      .update({ nova_status: data.status })
      .eq("id", data.accountId);

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

