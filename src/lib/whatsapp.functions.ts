import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { trackServiceUsage } from "./commercial.functions";
import { z } from "zod";

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
        company_id: CNM_COMPANY_ID,
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
          company_id: CNM_COMPANY_ID,
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
 */
export const sendBulkWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      recipients: z.array(z.string().min(10)),
      body: z.string().min(1),
      accountId: z.string().uuid(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { recipients, body, accountId } = data;
    const total = recipients.length;

    if (total === 0) throw new Error("No hay destinatarios.");

    // 1. Obtener credenciales
    const { data: account, error: accErr } = await context.supabase
      .from("whatsapp_accounts")
      .select("phone_number_id, access_token")
      .eq("id", accountId)
      .single();

    if (accErr || !account) throw new Error("Cuenta de WhatsApp no válida.");

    const batchId = crypto.randomUUID();

    // 2. Cobro atómico consolidado
    try {
      await trackServiceUsage({
        data: {
          company_id: CNM_COMPANY_ID,
          channel: "whatsapp",
          units: total,
          description: `Envío Masivo WA (${total} dest.)`,
          reference: batchId,
        },
      });
    } catch (err: any) {
      throw err; // Saldo insuficiente u otro error comercial
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
                type: "text",
                text: { body },
              }),
            }
          );

          const metaResult = await metaResponse.json();
          const isOk = metaResponse.ok;

          // Registrar en la DB
          await context.supabase.from("whatsapp_messages").insert({
            company_id: CNM_COMPANY_ID,
            to_phone: to,
            body,
            direction: "outbound",
            status: isOk ? "sent" : "failed",
            metadata: { batch_id: batchId, ...metaResult },
            cost: 0, 
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

    return { 
      ok: true, 
      batchId, 
      total, 
      sent: results.sent, 
      failed: results.failed,
      errors: results.details 
    };
  });

