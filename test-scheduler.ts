import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function testScheduler() {
  const companyId = "00000000-0000-4000-8000-000000000001";
  
  // 1. Crear una programación para "hace 1 minuto" (debe ejecutarse)
  const pastDate = new Date();
  pastDate.setMinutes(pastDate.getMinutes() - 5);
  
  console.log("--- TEST 1: Programación Vencida ---");
  const { data: sch1, error: err1 } = await supabaseAdmin.from("sms_schedules").insert({
    company_id: companyId,
    user_id: "00000000-0000-0000-0000-000000000000", // system or dummy
    recipients: ["3001234567", "3109876543"],
    body: "Test scheduler past",
    is_flash: false,
    scheduled_at: pastDate.toISOString(),
    timezone: "America/Bogota",
    estimated_cost: 60,
    reference: `test-past-${Date.now()}`,
    status: 'PROGRAMADO'
  } as any).select().single();

  if (err1) console.error("Error creating sch1:", err1.message);
  else console.log("Created sch1:", sch1.id, "at", sch1.scheduled_at);

  // 2. Crear una programación para el futuro (NO debe ejecutarse)
  const futureDate = new Date();
  futureDate.setHours(futureDate.getHours() + 1);
  
  console.log("--- TEST 2: Programación Futura ---");
  const { data: sch2, error: err2 } = await supabaseAdmin.from("sms_schedules").insert({
    company_id: companyId,
    user_id: "00000000-0000-0000-0000-000000000000",
    recipients: ["3001112233"],
    body: "Test scheduler future",
    is_flash: true,
    scheduled_at: futureDate.toISOString(),
    timezone: "America/Bogota",
    estimated_cost: 45, // Flash rate approx
    reference: `test-future-${Date.now()}`,
    status: 'PROGRAMADO'
  } as any).select().single();

  if (err2) console.error("Error creating sch2:", err2.message);
  else console.log("Created sch2:", sch2.id, "at", sch2.scheduled_at);

  // 3. Ejecutar el scheduler vía API interna (simulando cron)
  console.log("--- EXECUTING SCHEDULER ---");
  const { processPendingSmsSchedules } = await import("./src/lib/sms-schedule.functions");
  const result = await processPendingSmsSchedules();
  console.log("Result:", result);

  // 4. Verificar estados
  const { data: finalSch1 } = await supabaseAdmin.from("sms_schedules").select("status, executed_at, error_log").eq("id", sch1.id).single();
  const { data: finalSch2 } = await supabaseAdmin.from("sms_schedules").select("status").eq("id", sch2.id).single();

  console.log("Sch1 final status:", finalSch1?.status, "Executed at:", finalSch1?.executed_at, "Error:", finalSch1?.error_log);
  console.log("Sch2 final status:", finalSch2?.status);

  // 5. Test saldo insuficiente
  console.log("--- TEST 3: Saldo Insuficiente ---");
  const { data: sch3 } = await supabaseAdmin.from("sms_schedules").insert({
    company_id: companyId,
    user_id: "00000000-0000-0000-0000-000000000000",
    recipients: Array(10000).fill("3000000000"), // Un montón de destinatarios para forzar fallo de saldo
    body: "Test insufficient balance",
    is_flash: false,
    scheduled_at: pastDate.toISOString(),
    timezone: "America/Bogota",
    estimated_cost: 300000,
    reference: `test-low-balance-${Date.now()}`,
    status: 'PROGRAMADO'
  } as any).select().single();

  await processPendingSmsSchedules();
  const { data: finalSch3 } = await supabaseAdmin.from("sms_schedules").select("status, error_log").eq("id", sch3.id).single();
  console.log("Sch3 final status:", finalSch3?.status, "Error:", finalSch3?.error_log);
}

testScheduler().catch(console.error);
