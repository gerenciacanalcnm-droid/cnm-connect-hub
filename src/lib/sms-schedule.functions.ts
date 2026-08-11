import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { executePendingSchedules } from "./sms-schedule.server";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

export const createSmsSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipients: z.array(z.string().min(10)),
      body: z.string().min(1),
      isFlash: z.boolean().default(false),
      scheduledAt: z.string(),
      timezone: z.string().default('America/Bogota'),
      estimatedCost: z.number().nonnegative(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { recipients, body, isFlash, scheduledAt, timezone, estimatedCost } = data;
    
    let finalScheduledAt = scheduledAt;
    if (!scheduledAt.includes('Z') && !scheduledAt.includes('+') && !scheduledAt.includes('-')) {
      const offset = timezone === 'America/Bogota' ? '-05:00' : '-05:00'; 
      finalScheduledAt = `${scheduledAt}${offset}`;
    }

    const { data: row, error } = await context.supabase
      .from("sms_schedules")
      .insert({
        company_id: CNM_COMPANY_ID,
        user_id: context.userId,
        recipients,
        body,
        is_flash: isFlash,
        scheduled_at: finalScheduledAt,
        timezone,
        estimated_cost: estimatedCost,
        reference: crypto.randomUUID(),
        status: 'PROGRAMADO'
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const listSmsSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sms_schedules")
      .select("*")
      .order("scheduled_at", { ascending: false });
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  });

export const cancelSmsSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sms_schedules")
      .update({ status: 'CANCELADO' } as any)
      .eq("id", data.id)
      .eq("status", "PROGRAMADO");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const processPendingSmsSchedules = createServerFn({ method: "POST" })
  .handler(async () => {
    return executePendingSchedules(supabaseAdmin);
  });
