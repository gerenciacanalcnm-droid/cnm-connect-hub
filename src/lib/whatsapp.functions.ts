import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { trackServiceUsage } from "./commercial.functions";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

/**
 * WhatsApp Business - Meta Cloud API Integration
 * Multi-tenant creds storage and connection testing.
 */

export const testWhatsAppConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      businessAccountId: z.string().min(1),
      phoneNumberId: z.string().min(1),
      accessToken: z.string().min(1),
    }).parse(v)
  )
  .handler(async ({ data }) => {
    try {
      // Intentamos llamar al endpoint de Phone Number ID para validar el token y los IDs
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${data.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Error de validación con Meta");
      }

      // Verificamos que el Business Account ID coincida si viene en la respuesta
      // O simplemente validamos que la respuesta es exitosa
      return { 
        ok: true, 
        verifiedName: result.verified_name,
        displayPhoneNumber: result.display_phone_number
      };
    } catch (err: any) {
      console.error("[whatsapp.server] testWhatsAppConnection:", err.message);
      return { ok: false, error: err.message };
    }
  });

export const saveWhatsAppCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      accountId: z.string().uuid().optional(),
      alias: z.string().min(1),
      businessAccountId: z.string().min(1),
      phoneNumberId: z.string().min(1),
      accessToken: z.string().min(1),
      webhookVerifyToken: z.string().optional(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 1. Validar conexión antes de guardar como activo
    const test = await testWhatsAppConnection({ 
      data: {
        businessAccountId: data.businessAccountId,
        phoneNumberId: data.phoneNumberId,
        accessToken: data.accessToken
      }
    });

    if (!test.ok) {
      throw new Error("No fue posible conectar WhatsApp: Credenciales inválidas");
    }

    // 2. Upsert en whatsapp_accounts
    // El Access Token se guarda en la DB (RLS protege el acceso)
    // En producción real, esto podría ir a un vault externo.
    const row = {
      company_id: CNM_COMPANY_ID,
      alias: data.alias,
      provider: "meta",
      business_account_id: data.businessAccountId,
      phone_number_id: data.phoneNumberId,
      access_token: data.accessToken,
      webhook_verify_token: data.webhookVerifyToken || crypto.randomUUID(),
      status: "connected" as const,
      display_phone: test.displayPhoneNumber || null,
      verified_name: test.verifiedName || null,
      last_synced_at: new Date().toISOString(),
    };

    const { error } = data.accountId 
      ? await context.supabase.from("whatsapp_accounts").update(row).eq("id", data.accountId)
      : await context.supabase.from("whatsapp_accounts").insert(row);

    if (error) throw new Error(error.message);

    return { ok: true };
  });

/**
 * Envío individual de WhatsApp vía Meta Cloud API.
 * Ejecuta el cobro atómico antes de contactar a Meta.
 */
export const sendWhatsAppIndividual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipient: z.string().min(10),
      body: z.string().min(1),
      accountId: z.string().uuid(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 0. Obtener company_id del perfil del usuario
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .single();
    
    const companyId = profile?.company_id || CNM_COMPANY_ID;

    // 1. Obtener credenciales de la cuenta (usamos context.supabase con RLS)
    const { data: account, error: accErr } = await context.supabase
      .from("whatsapp_accounts")
      .select("phone_number_id, access_token")
      .eq("id", data.accountId)
      .single();

    if (accErr || !account) throw new Error("Cuenta de WhatsApp no encontrada o sin acceso");

    // 2. Registrar el mensaje en la base de datos (estado: sending)
    const { data: msg, error: msgErr } = await context.supabase
      .from("whatsapp_messages")
      .insert({
        company_id: companyId,
        to_phone: data.recipient,
        body: data.body,
        direction: "outbound" as const,
        status: "sending" as const,
        metadata: { account_id: data.accountId }
      } as never)
      .select("id")
      .single();

    if (msgErr) throw new Error(msgErr.message);

    // 3. Realizar cobro atómico
    try {
      const usage = await trackServiceUsage({
        data: {
          company_id: companyId,
          channel: "whatsapp",
          units: 1,
          description: `WA Individual a ${data.recipient}`,
          reference: msg.id,
        }
      });

      // Actualizar costo real
      await context.supabase
        .from("whatsapp_messages")
        .update({ cost: usage.amount } as never)
        .eq("id", msg.id);

    } catch (err: any) {
      // Fallo de saldo -> Marcar mensaje como fallido y abortar
      await context.supabase
        .from("whatsapp_messages")
        .update({ 
          status: "failed",
          metadata: { failure_reason: "insufficient_balance", error: err.message }
        } as never)
        .eq("id", msg.id);
      throw err;
    }

    // 4. Envío a Meta Cloud API
    try {
      const metaResponse = await fetch(
        `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: data.recipient.startsWith("57") ? data.recipient : `57${data.recipient}`,
            type: "text",
            text: { body: data.body },
          }),
        }
      );

      const metaResult = await metaResponse.json();

      if (!metaResponse.ok) {
        throw new Error(metaResult.error?.message || "Error al enviar mensaje vía Meta");
      }

      // 5. Actualizar a SENT
      await context.supabase
        .from("whatsapp_messages")
        .update({ 
          status: "sent",
          metadata: { ...metaResult } 
        } as never)
        .eq("id", msg.id);

      return { ok: true, messageId: msg.id, waId: metaResult.messages?.[0]?.id };

    } catch (err: any) {
      console.error("[whatsapp.send] Error:", err.message);
      
      // 6. Marcar como FAILED
      await context.supabase
        .from("whatsapp_messages")
        .update({ 
          status: "failed",
          metadata: { error: err.message }
        } as never)
        .eq("id", msg.id);
      
      throw err;
    }
  });

/**
 * Procesa el envío masivo de WhatsApp.
 * Realiza un cobro atómico por el total del lote antes de procesar.
 * Soporta texto libre y plantillas.
 */
export const sendBulkWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipients: z.array(z.string().min(10)),
      body: z.string().optional(),
      templateId: z.string().uuid().optional(),
      variables: z.record(z.string()).optional(),
      accountId: z.string().uuid(),
      batchId: z.string().optional(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { recipients, body, templateId, variables, accountId } = data;
    const total = recipients.length;

    if (total === 0) throw new Error("No hay destinatarios.");
    if (!body && !templateId) throw new Error("Se requiere mensaje o plantilla.");

    // 1. Obtener credenciales
    const { data: account, error: accErr } = await context.supabase
      .from("whatsapp_accounts")
      .select("phone_number_id, access_token")
      .eq("id", accountId)
      .single();

    if (accErr || !account) throw new Error("Cuenta de WhatsApp no válida.");

    // Si es plantilla, verificarla
    let templateData: any = null;
    if (templateId) {
      const { data: tpl, error: tplErr } = await context.supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      if (tplErr || !tpl) throw new Error("Plantilla no encontrada.");
      if (tpl.status !== "APPROVED") throw new Error("La plantilla no está aprobada.");
      templateData = tpl;
    }

    const batchId = data.batchId || crypto.randomUUID();

    // 2. Cobro atómico consolidado e Idempotencia
    try {
      await trackServiceUsage({
        data: {
          company_id: CNM_COMPANY_ID,
          channel: "whatsapp",
          units: total,
          description: `Envío Masivo WA (${total} dest.) - ${templateData?.name || 'Texto'}`,
          reference: batchId,
        },
      });
    } catch (err: any) {
      throw err; // Saldo insuficiente u otro error comercial (Idempotencia manejada en applyWalletMovement)
    }

    // 3. Procesamiento por lotes (Chunks de 20 para evitar timeouts)
    const results = { sent: 0, failed: 0, details: [] as any[] };
    const chunks = [];
    for (let i = 0; i < recipients.length; i += 20) {
      chunks.push(recipients.slice(i, i + 20));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (to) => {
        try {
          const toFormatted = to.startsWith("57") ? to : `57${to}`;
          
          let metaPayload: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: toFormatted,
          };

          if (templateId && templateData) {
            const parameters = Object.keys(variables || {}).sort((a, b) => parseInt(a) - parseInt(b)).map(key => ({
              type: "text",
              text: variables![key]
            }));

            metaPayload = {
              ...metaPayload,
              type: "template",
              template: {
                name: templateData.name,
                language: { code: templateData.language },
                components: parameters.length > 0 ? [{
                  type: "body",
                  parameters: parameters
                }] : []
              }
            };
          } else {
            metaPayload = {
              ...metaPayload,
              type: "text",
              text: { body: body || "" },
            };
          }

          const metaResponse = await fetch(
            `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${account.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(metaPayload),
            }
          );

          const metaResult = await metaResponse.json();
          const isOk = metaResponse.ok;

          // Registrar en la DB
          await context.supabase.from("whatsapp_messages").insert({
            company_id: CNM_COMPANY_ID,
            account_id: accountId,
            to_phone: to,
            body: templateId ? templateData.body : body,
            template_id: templateId as any,
            direction: "outbound",
            status: isOk ? "sent" : "failed",
            external_id: metaResult.messages?.[0]?.id,
            error_code: isOk ? null : metaResult.error?.code?.toString(),
            metadata: { batch_id: batchId, ...metaResult, variables },
            cost: 0, // Cobrado en el batch
          } as never);

          if (isOk) {
            results.sent++;
          } else {
            results.failed++;
            results.details.push({ to, error: metaResult.error?.message });
          }
        } catch (err: any) {
          results.failed++;
          results.details.push({ to, error: err.message });
        }
      });

      await Promise.all(chunkPromises);
    }

    // 4. Auditoría
    await context.supabase.from("audit_logs").insert({
      company_id: CNM_COMPANY_ID,
      user_id: context.userId,
      module: "communication",
      action: "whatsapp_bulk_send",
      detail: `Envío masivo completado: ${results.sent} enviados, ${results.failed} fallidos.`,
      metadata: { batch_id: batchId, total, sent: results.sent, failed: results.failed }
    } as any);

    return { 
      ok: true, 
      batchId, 
      total, 
      sent: results.sent, 
      failed: results.failed,
      errors: results.details 
    };
  });

/**
 * Sincroniza plantillas desde Meta Cloud API y las guarda localmente.
 */
export const syncWhatsAppTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ accountId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // 1. Obtener credenciales
    const { data: account, error: accErr } = await context.supabase
      .from("whatsapp_accounts")
      .select("business_account_id, access_token")
      .eq("id", data.accountId)
      .single();

    if (accErr || !account || !account.business_account_id) {
      throw new Error("Cuenta de WhatsApp no válida para sincronización.");
    }

    // 2. Llamada a Meta (Message Templates)
    console.log(`[sync] Consultando plantillas para WABA: ${account.business_account_id}`);
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${account.business_account_id}/message_templates?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error("[sync] Error Meta API:", result);
      throw new Error(result.error?.message || "Error al sincronizar con Meta");
    }

    const templates = result.data || [];
    console.log(`[sync] Meta devolvió ${templates.length} plantillas.`);
    
    let updated = 0;
    let errors = 0;

    // 3. Procesar y guardar en la base de datos
    const results = [];
    for (const t of templates) {
      try {
        console.log(`[sync] Procesando plantilla Meta: ID=${t.id}, Name=${t.name}, Status=${t.status}`);
        
        const bodyComponent = t.components?.find((c: any) => c.type === "BODY");
        const headerComponent = t.components?.find((c: any) => c.type === "HEADER");
        const footerComponent = t.components?.find((c: any) => c.type === "FOOTER");
        const buttonsComponent = t.components?.find((c: any) => c.type === "BUTTONS");

        const bodyText = bodyComponent?.text || "";
        const variables = bodyText.match(/{{(\d+)}}/g) || [];
        
        const row = {
          company_id: CNM_COMPANY_ID,
          account_id: data.accountId,
          external_id: t.id,
          name: t.name,
          category: t.category,
          language: t.language,
          status: t.status,
          body: bodyText,
          header: headerComponent?.text || null,
          footer: footerComponent?.text || null,
          buttons: buttonsComponent || [],
          variables: variables as any,
          updated_at: new Date().toISOString()
        };

        const { error: upsertErr } = await context.supabase
          .from("whatsapp_templates")
          .upsert(row, { onConflict: "account_id, external_id, language" });

        if (upsertErr) {
          console.error(`[sync] Error al upsertar ${t.name}:`, upsertErr.message);
          errors++;
          results.push({ name: t.name, external_id: t.id, language: t.language, status: t.status, success: false, error: upsertErr.message });
        } else {
          updated++;
          results.push({ name: t.name, external_id: t.id, language: t.language, status: t.status, success: true });
        }
      } catch (err: any) {
        console.error(`[sync] Error inesperado en loop para ${t.name}:`, err.message);
        errors++;
        results.push({ name: t.name, external_id: t.id, language: t.language, status: t.status, success: false, error: err.message });
      }
    }

    return { 
      ok: true, 
      count: templates.length,
      updated,
      errors,
      details: results
    };
  });

/**
 * Envío de WhatsApp utilizando una PLANTILLA.
 */
export const sendWhatsAppTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipient: z.string().min(10),
      templateId: z.string().uuid(),
      variables: z.record(z.string()).optional(),
      accountId: z.string().uuid(),
      batchId: z.string().optional(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const [tplRes, accRes] = await Promise.all([
      context.supabase.from("whatsapp_templates").select("*").eq("id", data.templateId).single(),
      context.supabase.from("whatsapp_accounts").select("phone_number_id, access_token").eq("id", data.accountId).single()
    ]);

    if (tplRes.error || !tplRes.data) throw new Error("Plantilla no encontrada");
    if (accRes.error || !accRes.data) throw new Error("Cuenta de WhatsApp no válida");

    const template = tplRes.data;
    const account = accRes.data;

    if (template.status !== "APPROVED") {
      throw new Error(`La plantilla no puede usarse porque su estado es: ${template.status}`);
    }

    let usageAmount = 0;
    if (!data.batchId) {
      try {
        const usage = await trackServiceUsage({
          data: {
            company_id: CNM_COMPANY_ID,
            channel: "whatsapp",
            units: 1,
            description: `WA Template (${template.name}) a ${data.recipient}`,
            reference: crypto.randomUUID(),
          }
        });
        usageAmount = usage.amount;
      } catch (err: any) {
        throw err;
      }
    }

    const { data: msg, error: msgErr } = await context.supabase
      .from("whatsapp_messages")
      .insert({
        company_id: CNM_COMPANY_ID,
        account_id: data.accountId,
        to_phone: data.recipient,
        template_id: data.templateId as any,
        body: template.body,
        direction: "outbound",
        status: "sending",
        cost: usageAmount,
        metadata: { batch_id: data.batchId, template_name: template.name, variables: data.variables }
      } as never)
      .select("id")
      .single();

    if (msgErr) throw new Error(msgErr.message);

    try {
      const parameters = Object.keys(data.variables || {}).sort((a, b) => parseInt(a) - parseInt(b)).map(key => ({
        type: "text",
        text: data.variables![key]
      }));

      const toFormatted = data.recipient.startsWith("57") ? data.recipient : `57${data.recipient}`;

      const metaResponse = await fetch(
        `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: toFormatted,
            type: "template",
            template: {
              name: template.name,
              language: { code: template.language },
              components: parameters.length > 0 ? [{
                type: "body",
                parameters: parameters
              }] : []
            }
          }),
        }
      );

      const metaResult = await metaResponse.json();
      if (!metaResponse.ok) throw new Error(metaResult.error?.message || "Error de Meta API");

      await context.supabase
        .from("whatsapp_messages")
        .update({ status: "sent", external_id: metaResult.messages?.[0]?.id } as never)
        .eq("id", msg.id);

      return { ok: true, messageId: msg.id };
    } catch (err: any) {
      await context.supabase
        .from("whatsapp_messages")
        .update({ status: "failed", error_code: "META_API_ERROR", metadata: { error: err.message } } as never)
        .eq("id", msg.id);
      throw err;
    }
  });

/**
 * Programación de envíos de WhatsApp.
 */
export const createWhatsAppSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      accountId: z.string().uuid(),
      recipients: z.array(z.string().min(10)),
      body: z.string().optional(),
      templateId: z.string().uuid().optional(),
      variables: z.record(z.string()).optional(),
      scheduledAt: z.string(),
      timezone: z.string().default('America/Bogota'),
      estimatedCost: z.number().nonnegative(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { accountId, recipients, body, templateId, variables, scheduledAt, timezone, estimatedCost } = data;
    
    let finalScheduledAt = scheduledAt;
    if (!scheduledAt.includes('Z') && !scheduledAt.includes('+') && !scheduledAt.includes('-')) {
      const offset = timezone === 'America/Bogota' ? '-05:00' : '-05:00'; 
      finalScheduledAt = `${scheduledAt}${offset}`;
    }

    const { data: row, error } = await context.supabase
      .from("wa_schedules")
      .insert({
        company_id: CNM_COMPANY_ID,
        user_id: context.userId,
        account_id: accountId,
        recipients,
        message_body: body,
        template_id: templateId,
        variables,
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

export const listWhatsAppSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wa_schedules")
      .select("*, whatsapp_templates(name), whatsapp_accounts(alias)")
      .order("scheduled_at", { ascending: false });
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  });

export const cancelWhatsAppSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("wa_schedules")
      .update({ status: 'CANCELADO' } as any)
      .eq("id", data.id)
      .eq("status", "PROGRAMADO");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
