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
340: 
341: /**
342:  * Sincroniza plantillas desde Meta Cloud API y las guarda localmente.
343:  */
344: export const syncWhatsAppTemplates = createServerFn({ method: "POST" })
345:   .middleware([requireSupabaseAuth])
346:   .inputValidator((v) => z.object({ accountId: z.string().uuid() }).parse(v))
347:   .handler(async ({ data, context }) => {
348:     // 1. Obtener credenciales
349:     const { data: account, error: accErr } = await context.supabase
350:       .from("whatsapp_accounts")
351:       .select("business_account_id, access_token")
352:       .eq("id", data.accountId)
353:       .single();
354: 
355:     if (accErr || !account || !account.business_account_id) {
356:       throw new Error("Cuenta de WhatsApp no válida para sincronización.");
357:     }
358: 
359:     // 2. Llamada a Meta (Message Templates)
360:     const response = await fetch(
361:       `https://graph.facebook.com/v20.0/${account.business_account_id}/message_templates?limit=100`,
362:       {
363:         headers: {
364:           Authorization: `Bearer ${account.access_token}`,
365:         },
366:       }
367:     );
368: 
369:     const result = await response.json();
370:     if (!response.ok) {
371:       throw new Error(result.error?.message || "Error al sincronizar con Meta");
372:     }
373: 
374:     const templates = result.data || [];
375:     
376:     // 3. Procesar y guardar en la base de datos
377:     // Mapeamos lo que viene de Meta a nuestra estructura local
378:     for (const t of templates) {
379:       // Buscar componentes de cuerpo para extraer el texto y variables
380:       const bodyComponent = t.components?.find((c: any) => c.type === "BODY");
381:       const headerComponent = t.components?.find((c: any) => c.type === "HEADER");
382:       const footerComponent = t.components?.find((c: any) => c.type === "FOOTER");
383:       const buttonsComponent = t.components?.find((c: any) => c.type === "BUTTONS");
384: 
385:       const bodyText = bodyComponent?.text || "";
386:       
387:       // Detectar variables {{1}}, {{2}}, etc.
388:       const variables = bodyText.match(/{{(\d+)}}/g) || [];
389:       
390:       const row = {
391:         company_id: CNM_COMPANY_ID,
392:         account_id: data.accountId,
393:         external_id: t.id,
394:         name: t.name,
395:         category: t.category,
396:         language: t.language,
397:         status: t.status,
398:         body: bodyText,
399:         header: headerComponent?.text || null,
400:         footer: footerComponent?.text || null,
401:         buttons: buttonsComponent || null,
402:         variables: variables as any,
403:         updated_at: new Date().toISOString()
404:       };
405: 
406:       // Upsert por nombre e idioma (que es único en Meta por WABA)
407:       await context.supabase
408:         .from("whatsapp_templates")
409:         .upsert(row, { onConflict: "company_id, name, language" });
410:     }
411: 
412:     return { ok: true, count: templates.length };
413:   });
414: 
415: /**
416:  * Envío de WhatsApp utilizando una PLANTILLA.
417:  */
418: export const sendWhatsAppTemplate = createServerFn({ method: "POST" })
419:   .middleware([requireSupabaseAuth])
420:   .inputValidator((v) =>
421:     z.object({
422:       recipient: z.string().min(10),
423:       templateId: z.string().uuid(),
424:       variables: z.record(z.string()).optional(),
425:       accountId: z.string().uuid(),
426:       batchId: z.string().optional(), // Para envíos masivos
427:     }).parse(v)
428:   )
429:   .handler(async ({ data, context }) => {
430:     // 1. Obtener plantilla y cuenta
431:     const [tplRes, accRes] = await Promise.all([
432:       context.supabase.from("whatsapp_templates").select("*").eq("id", data.templateId).single(),
433:       context.supabase.from("whatsapp_accounts").select("phone_number_id, access_token").eq("id", data.accountId).single()
434:     ]);
435: 
436:     if (tplRes.error || !tplRes.data) throw new Error("Plantilla no encontrada");
437:     if (accRes.error || !accRes.data) throw new Error("Cuenta de WhatsApp no válida");
438: 
439:     const template = tplRes.data;
440:     const account = accRes.data;
441: 
442:     if (template.status !== "APPROVED") {
443:       throw new Error(`La plantilla no puede usarse porque su estado es: ${template.status}`);
444:     }
445: 
446:     // 2. Cobro (Solo si no viene de un lote masivo que ya cobró)
447:     let usageAmount = 0;
448:     if (!data.batchId) {
449:       try {
450:         const usage = await trackServiceUsage({
451:           data: {
452:             company_id: CNM_COMPANY_ID,
453:             channel: "whatsapp",
454:             units: 1,
455:             description: `WA Template (${template.name}) a ${data.recipient}`,
456:             reference: crypto.randomUUID(),
457:           }
458:         });
459:         usageAmount = usage.amount;
460:       } catch (err: any) {
461:         throw err;
462:       }
463:     }
464: 
465:     // 3. Registrar mensaje
466:     const { data: msg, error: msgErr } = await context.supabase
467:       .from("whatsapp_messages")
468:       .insert({
469:         company_id: CNM_COMPANY_ID,
470:         account_id: data.accountId,
471:         to_phone: data.recipient,
472:         template_id: data.templateId as any,
473:         body: template.body, // Guardamos el texto base
474:         direction: "outbound",
475:         status: "sending",
476:         cost: usageAmount,
477:         metadata: { batch_id: data.batchId, template_name: template.name, variables: data.variables }
478:       } as never)
479:       .select("id")
480:       .single();
481: 
482:     if (msgErr) throw new Error(msgErr.message);
483: 
484:     // 4. Envío a Meta
485:     try {
486:       // Construir parámetros de variables si existen
487:       const parameters = Object.keys(data.variables || {}).sort().map(key => ({
488:         type: "text",
489:         text: data.variables![key]
490:       }));
491: 
492:       const toFormatted = data.recipient.startsWith("57") ? data.recipient : `57${data.recipient}`;
493: 
494:       const metaResponse = await fetch(
495:         `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`,
496:         {
497:           method: "POST",
498:           headers: {
499:             "Authorization": `Bearer ${account.access_token}`,
500:             "Content-Type": "application/json",
501:           },
502:           body: JSON.stringify({
503:             messaging_product: "whatsapp",
504:             recipient_type: "individual",
505:             to: toFormatted,
506:             type: "template",
507:             template: {
508:               name: template.name,
509:               language: { code: template.language },
510:               components: parameters.length > 0 ? [{
511:                 type: "body",
512:                 parameters: parameters
513:               }] : []
514:             }
515:           }),
516:         }
517:       );
518: 
519:       const metaResult = await metaResponse.json();
520:       
521:       if (!metaResponse.ok) {
522:         throw new Error(metaResult.error?.message || "Error de Meta API");
523:       }
524: 
525:       await context.supabase
526:         .from("whatsapp_messages")
527:         .update({ status: "sent", external_id: metaResult.messages?.[0]?.id } as never)
528:         .eq("id", msg.id);
529: 
530:       return { ok: true, messageId: msg.id };
531: 
532:     } catch (err: any) {
533:       await context.supabase
534:         .from("whatsapp_messages")
535:         .update({ status: "failed", error_code: "META_API_ERROR", metadata: { error: err.message } } as never)
536:         .eq("id", msg.id);
537:       throw err;
538:     }
539:   });


