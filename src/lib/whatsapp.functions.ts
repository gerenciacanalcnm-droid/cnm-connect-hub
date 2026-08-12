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
      body: z.string().min(1).optional(),
      templateId: z.string().uuid().optional(),
      variables: z.record(z.string()).optional(),
      accountId: z.string().uuid(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    try {
      // 0. Autenticación y Empresa
      const { data: membership, error: memErr } = await context.supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", context.userId)
        .eq("is_active", true)
        .maybeSingle();
      
      if (memErr) {
        console.error("[whatsapp.auth] Error buscando membresía:", memErr.message);
        throw new Error(`AUTH_USER_ERROR: Error al validar membresía: ${memErr.message}`);
      }

      const companyId = membership?.company_id || CNM_COMPANY_ID;
      if (!companyId) throw new Error("AUTH_USER_ERROR: No se pudo determinar el company_id");

      // 1. Obtener credenciales de la cuenta
      const { data: account, error: accErr } = await context.supabase
        .from("whatsapp_accounts")
        .select("phone_number_id, access_token, company_id, business_account_id")
        .eq("id", data.accountId)
        .single();

      if (accErr) {
        console.error("[whatsapp.db] Error buscando cuenta:", accErr.message);
        throw new Error(`DB_AUTH_ERROR: Cuenta no encontrada o sin acceso: ${accErr.message}`);
      }

      if (account.company_id !== companyId) {
        throw new Error("DB_AUTH_ERROR: La cuenta seleccionada no pertenece a tu empresa");
      }

      // Validar plantilla si aplica
      let templateData: any = null;
      if (data.templateId) {
        const { data: tpl, error: tplErr } = await context.supabase
          .from("whatsapp_templates")
          .select("*")
          .eq("id", data.templateId)
          .eq("company_id", companyId)
          .single();
        
        if (tplErr || !tpl) {
          throw new Error(`DB_AUTH_ERROR: Plantilla no encontrada o sin acceso: ${tplErr?.message || 'NULL'}`);
        }
        if (tpl.status !== "APPROVED") throw new Error(`META_API_ERROR: La plantilla no está aprobada (Estado: ${tpl.status})`);
        templateData = tpl;
      }

      // 2. Preparar payload para Meta
      const toFormatted = data.recipient.startsWith("57") ? data.recipient : `57${data.recipient}`;
      let metaPayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toFormatted,
      };

      if (data.templateId && templateData) {
        // Fetch real template components from Meta Graph API
        console.log(`[whatsapp.meta_fetch] Consultando estructura real de la plantilla: ${templateData.name}`);
        const tplResponse = await fetch(
          `https://graph.facebook.com/v20.0/${account.business_account_id}/message_templates?name=${templateData.name}`,
          {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          }
        );

        if (!tplResponse.ok) {
          throw new Error(`META_API_ERROR: No se pudo verificar la estructura de la plantilla en Meta. Status: ${tplResponse.status}`);
        }

        const tplResult = await tplResponse.json();
        const metaTemplate = tplResult.data?.find((t: any) => t.name === templateData.name && t.language === templateData.language);

        if (!metaTemplate) {
          throw new Error(`META_API_ERROR: La plantilla ${templateData.name} (${templateData.language}) no existe en este WABA.`);
        }

        // Build components dynamically based on Meta's real structure
        const components: any[] = [];

        metaTemplate.components.forEach((comp: any) => {
          if (comp.type === "BODY" || comp.type === "HEADER") {
            const text = comp.text || "";
            const matches = (text.match(/{{(\d+)}}/g) || []) as string[];
            
            const uniqueVarIndices = Array.from(new Set(matches.map((m: string) => m.replace(/[{}]/g, ''))));

            if (uniqueVarIndices.length > 0) {
              const parameters: any[] = [];
              uniqueVarIndices.forEach((idx: unknown) => {
                const stringIdx = idx as string;
                const val = data.variables?.[stringIdx];
                if (val !== undefined) {
                  parameters.push({ type: "text", text: val });
                }
              });

              if (parameters.length > 0) {
                components.push({
                  type: comp.type.toLowerCase(),
                  parameters: parameters
                });
              }
            }
          }
        });

        metaPayload = {
          ...metaPayload,
          type: "template",
          template: {
            name: metaTemplate.name,
            language: { code: metaTemplate.language },
            components: components
          }
        };
      } else {
        metaPayload = {
          ...metaPayload,
          type: "text",
          text: { body: data.body || "" },
        };
      }

      // 3. Envío a Meta Cloud API
      console.log(`[whatsapp.meta_call] Enviando a Meta: account=${data.accountId}, phone_id=${account.phone_number_id}`);
      
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

      if (!metaResponse.ok) {
        const metaErrorCode = metaResult.error?.code;
        const metaErrorMessage = metaResult.error?.message;
        
        if (metaErrorCode === 132012) {
          throw new Error(`META_TEMPLATE_PARAMETER_ERROR: Los parámetros enviados no coinciden con la estructura de la plantilla aprobada en Meta. Code: 132012, Msg: ${metaErrorMessage}. Payload sent: ${JSON.stringify(metaPayload.template?.components || [])}`);
        }

        if (metaResponse.status === 401 || metaResponse.status === 403) {
          throw new Error(`META_AUTH_ERROR: Meta rechazó las credenciales. Status: ${metaResponse.status}, Code: ${metaErrorCode}, Msg: ${metaErrorMessage}`);
        }
        throw new Error(`META_API_ERROR: Error de Meta API. Status: ${metaResponse.status}, Code: ${metaErrorCode}, Msg: ${metaErrorMessage}`);
      }

      const wamid = metaResult.messages?.[0]?.id;

      // 4. Cobro y Registro solo tras ÉXITO en Meta
      try {
        await trackServiceUsage({
          data: {
            company_id: companyId,
            channel: "whatsapp",
            units: 1,
            description: `WA ${data.templateId ? 'Template' : 'Individual'} a ${data.recipient}`,
            reference: wamid || crypto.randomUUID(),
          }
        });

        // Registrar el mensaje
        await context.supabase
          .from("whatsapp_messages")
          .insert({
            company_id: companyId,
            account_id: data.accountId,
            to_phone: data.recipient,
            body: data.templateId ? templateData.body : data.body,
            template_id: data.templateId,
            direction: "outbound",
            status: "sent",
            external_id: wamid,
            metadata: { ...metaResult, variables: data.variables },
            cost: 250
          } as never);

      } catch (postErr: any) {
        console.error("[whatsapp.post_process] Error en cobro/registro:", postErr.message);
        // No lanzamos error para el usuario porque el mensaje YA se envió a Meta
      }

      return { ok: true, messageId: wamid, waId: wamid };

    } catch (err: any) {
      console.error("[whatsapp.individual_send] Error fatal:", err.message);
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
    const batchId = data.batchId || crypto.randomUUID();

    if (total === 0) throw new Error("No hay destinatarios.");
    if (!body && !templateId) throw new Error("Se requiere mensaje o plantilla.");

    // 1. Autenticación y Empresa
    const { data: membership, error: memErr } = await context.supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    
    if (memErr) throw new Error(`AUTH_USER_ERROR: Membresía. ${memErr.message}`);
    const realCompanyId = membership?.company_id || CNM_COMPANY_ID;

    // 2. Obtener credenciales
    const { data: account, error: accErr } = await context.supabase
      .from("whatsapp_accounts")
      .select("phone_number_id, access_token, company_id")
      .eq("id", accountId)
      .single();

    if (accErr || !account) throw new Error(`DB_AUTH_ERROR: Cuenta no válida o sin acceso.`);
    if (account.company_id !== realCompanyId) throw new Error("DB_AUTH_ERROR: Cuenta no pertenece a la empresa.");

    // Si es plantilla, verificarla
    let templateData: any = null;
    if (templateId) {
      const { data: tpl, error: tplErr } = await context.supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("id", templateId)
        .eq("company_id", realCompanyId)
        .single();
      if (tplErr || !tpl) throw new Error(`DB_AUTH_ERROR: Plantilla no encontrada.`);
      if (tpl.status !== "APPROVED") throw new Error(`META_API_ERROR: Plantilla no aprobada.`);
      templateData = tpl;
    }

    try {
      await trackServiceUsage({
        data: {
          company_id: realCompanyId,
          channel: "whatsapp",
          units: total,
          description: `Envío Masivo WA (${total} dest.) - ${templateData?.name || 'Texto'}`,
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
            company_id: realCompanyId,
            account_id: accountId,
            to_phone: to,
            body: templateId ? templateData.body : body,
            template_id: templateId,
            direction: "outbound",
            status: isOk ? "sent" : "failed",
            external_id: metaResult.messages?.[0]?.id,
            error_code: isOk ? null : metaResult.error?.code?.toString(),
            metadata: { batch_id: batchId, ...metaResult, variables },
            cost: isOk ? 250 : 0, // Costo real si fue enviado
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
      .select("business_account_id, access_token, company_id")
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
        const allVars = bodyText.match(/{{(\d+)}}/g) || [];
        const variables = [...new Set(allVars)];
        
        const row = {
          company_id: account.company_id as string,
          account_id: data.accountId,
          external_id: t.id,
          name: t.name,
          category: t.category,
          language: t.language,
          status: t.status,
          body: bodyText,
          header: headerComponent?.text || (headerComponent?.format !== 'TEXT' ? headerComponent?.format : null),
          footer: footerComponent?.text || null,
          buttons: buttonsComponent || [],
          variables: variables as any,
          metadata: { 
            ...t,
            header_type: headerComponent?.format || 'NONE',
            header_text: headerComponent?.text || null
          },
          updated_at: new Date().toISOString()
        };

        const { error: upsertErr } = await context.supabase
          .from("whatsapp_templates")
          .upsert(row, { onConflict: "account_id, external_id" });

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
    try {
      // 0. Autenticación y Empresa
      const { data: membership, error: memErr } = await context.supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", context.userId)
        .eq("is_active", true)
        .maybeSingle();
      
      if (memErr) throw new Error(`AUTH_USER_ERROR: Error al validar membresía: ${memErr.message}`);
      const companyId = membership?.company_id || CNM_COMPANY_ID;
      if (!companyId) throw new Error("AUTH_USER_ERROR: No se pudo determinar el company_id");

      // 1. Cargar plantilla y cuenta
      const [tplRes, accRes] = await Promise.all([
        context.supabase.from("whatsapp_templates").select("*").eq("id", data.templateId).eq("company_id", companyId).single(),
        context.supabase.from("whatsapp_accounts").select("phone_number_id, access_token, company_id, business_account_id").eq("id", data.accountId).single()
      ]);

      if (tplRes.error || !tplRes.data) throw new Error(`DB_AUTH_ERROR: Plantilla no encontrada: ${tplRes.error?.message || 'NULL'}`);
      if (accRes.error || !accRes.data) throw new Error(`DB_AUTH_ERROR: Cuenta no encontrada: ${accRes.error?.message || 'NULL'}`);

      if (accRes.data.company_id !== companyId) throw new Error("DB_AUTH_ERROR: Cuenta no pertenece a la empresa");

      const template = tplRes.data;
      const account = accRes.data;

      if (template.status !== "APPROVED") throw new Error(`META_API_ERROR: La plantilla no está aprobada (Estado: ${template.status})`);

      // 2. Cobro (solo si no es batch, el batch cobra por adelantado el total)
      if (!data.batchId) {
        try {
          await trackServiceUsage({
            data: {
              company_id: companyId,
              channel: "whatsapp",
              units: 1,
              description: `WA Template (${template.name}) a ${data.recipient}`,
              reference: crypto.randomUUID(),
            }
          });
        } catch (err: any) {
          throw err;
        }
      }

      // 3. Envío a Meta
      // Fetch real template components from Meta Graph API
      console.log(`[whatsapp.meta_fetch_template] Consultando estructura real: ${template.name}`);
      const tplResponse = await fetch(
        `https://graph.facebook.com/v20.0/${account.business_account_id}/message_templates?name=${template.name}`,
        {
          headers: {
            Authorization: `Bearer ${account.access_token}`,
          },
        }
      );

      if (!tplResponse.ok) {
        throw new Error(`META_API_ERROR: No se pudo verificar la estructura de la plantilla en Meta. Status: ${tplResponse.status}`);
      }

      const tplResult = await tplResponse.json();
      const metaTemplate = tplResult.data?.find((t: any) => t.name === template.name && t.language === template.language);

      if (!metaTemplate) {
        throw new Error(`META_API_ERROR: La plantilla ${template.name} (${template.language}) no existe en el WABA.`);
      }

      const components: any[] = [];
      metaTemplate.components.forEach((comp: any) => {
        if (comp.type === "BODY" || comp.type === "HEADER") {
          const matches = (comp.text || "").match(/{{(\d+)}}/g) || [];
          const varCount = new Set(matches).size;
          if (varCount > 0) {
            const parameters: any[] = [];
            for (let i = 1; i <= varCount; i++) {
              const val = data.variables?.[i.toString()];
              if (val !== undefined) {
                parameters.push({ type: "text", text: val });
              }
            }
            if (parameters.length > 0) {
              components.push({ type: comp.type.toLowerCase(), parameters });
            }
          }
        }
      });

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
              name: metaTemplate.name,
              language: { code: metaTemplate.language },
              components: components
            }
          }),
        }
      );

      const metaResult = await metaResponse.json();
      if (!metaResponse.ok) {
        const metaErrorCode = metaResult.error?.code;
        if (metaErrorCode === 132012) {
          throw new Error(`META_TEMPLATE_PARAMETER_ERROR: Parámetros no coinciden con plantilla Meta. Msg: ${metaResult.error?.message}`);
        }
        if (metaResponse.status === 401 || metaResponse.status === 403) {
          throw new Error(`META_AUTH_ERROR: Meta rechazó credenciales. Code: ${metaResult.error?.code}, Msg: ${metaResult.error?.message}`);
        }
        throw new Error(`META_API_ERROR: Meta Error. Code: ${metaResult.error?.code}, Msg: ${metaResult.error?.message}`);
      }

      const wamid = metaResult.messages?.[0]?.id;

      // 4. Registro
      await context.supabase
        .from("whatsapp_messages")
        .insert({
          company_id: companyId,
          account_id: data.accountId,
          to_phone: data.recipient,
          template_id: data.templateId,
          body: template.body,
          direction: "outbound",
          status: "sent",
          external_id: wamid,
          metadata: { ...metaResult, variables: data.variables },
          cost: 250
        } as never);

      return { ok: true, messageId: wamid };

    } catch (err: any) {
      console.error("[whatsapp.template_send] Error:", err.message);
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
