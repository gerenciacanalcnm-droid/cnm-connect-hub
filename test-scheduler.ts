import { supabaseAdmin } from "./src/integrations/supabase/client.server";
import { processPendingSmsSchedulesInternal } from "./src/lib/sms-schedule.functions";

async function testScheduler() {
  const companyId = "00000000-0000-4000-8000-000000000001";
  
  // Usar un ID de usuario válido del sistema
  const userId = "24c1dade-b79c-4b44-b23f-2851ad15262c";
  
  // 1. Crear una programación para "hace 5 minutos" (debe ejecutarse)
  const pastDate = new Date();
  pastDate.setMinutes(pastDate.getMinutes() - 5);
  
  console.log("\n--- TEST 1: Programación Vencida ---");
  const { data: sch1, error: err1 } = await supabaseAdmin.from("sms_schedules").insert({
    company_id: companyId,
    user_id: userId, 
    recipients: ["3001234567", "3109876543"],
    body: "Test scheduler past",
    is_flash: false,
    scheduled_at: pastDate.toISOString(),
    timezone: "America/Bogota",
    estimated_cost: 60,
    reference: `test-past-${Date.now()}`,
    status: 'PROGRAMADO'
  } as any).select().single();

  if (err1) {
    console.error("Error creando sch1:", err1.message);
  } else {
    console.log("Creada sch1:", sch1.id, "a las", sch1.scheduled_at);
  }

  // 2. Crear una programación para el futuro (NO debe ejecutarse)
  const futureDate = new Date();
  futureDate.setHours(futureDate.getHours() + 1);
  
  console.log("\n--- TEST 2: Programación Futura ---");
  const { data: sch2, error: err2 } = await supabaseAdmin.from("sms_schedules").insert({
    company_id: companyId,
    user_id: userId,
    recipients: ["3001112233"],
    body: "Test scheduler future",
    is_flash: true,
    scheduled_at: futureDate.toISOString(),
    timezone: "America/Bogota",
    estimated_cost: 45, 
    reference: `test-future-${Date.now()}`,
    status: 'PROGRAMADO'
  } as any).select().single();

  if (err2) {
    console.error("Error creando sch2:", err2.message);
  } else {
    console.log("Creada sch2:", sch2.id, "a las", sch2.scheduled_at);
  }

  // 3. Ejecutar el scheduler (usando la función interna que no requiere contexto de TanStack Start)
  console.log("\n--- EJECUTANDO SCHEDULER ---");
  const result = await processPendingSmsSchedulesInternal(supabaseAdmin);
  console.log("Resultado:", JSON.stringify(result, null, 2));

  // 4. Verificar estados finales
  const { data: finalSch1 } = await supabaseAdmin.from("sms_schedules").select("status, executed_at, error_log, actual_cost").eq("id", sch1.id).single();
  const { data: finalSch2 } = await supabaseAdmin.from("sms_schedules").select("status").eq("id", sch2.id).single();

  console.log("\n--- VERIFICACIÓN ---");
  console.log("Estado final Sch1:", finalSch1?.status, "| Ejecutado:", finalSch1?.executed_at, "| Costo:", finalSch1?.actual_cost);
  console.log("Estado final Sch2:", finalSch2?.status, "(Debe ser PROGRAMADO)");

  // 5. Test saldo insuficiente
  console.log("\n--- TEST 3: Saldo Insuficiente ---");
  const { data: sch3, error: err3 } = await supabaseAdmin.from("sms_schedules").insert({
    company_id: companyId,
    user_id: userId,
    recipients: Array(50000).fill("3000000000"), // Costo masivo
    body: "Test insufficient balance",
    is_flash: false,
    scheduled_at: pastDate.toISOString(),
    timezone: "America/Bogota",
    estimated_cost: 1500000,
    reference: `test-low-balance-${Date.now()}`,
    status: 'PROGRAMADO'
  } as any).select().single();

  if (err3) {
    console.error("Error creando sch3:", err3.message);
  } else {
    console.log("Creada sch3 para test de saldo.");
    const result3 = await processPendingSmsSchedulesInternal(supabaseAdmin);
    const { data: finalSch3 } = await supabaseAdmin.from("sms_schedules").select("status, error_log").eq("id", sch3.id).single();
    console.log("Estado final Sch3:", finalSch3?.status, "| Error:", finalSch3?.error_log);
  }
}

testScheduler().catch(console.error);
