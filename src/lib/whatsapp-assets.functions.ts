import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sube un archivo a Meta usando la Resumable Upload API y devuelve el
 * "header_handle" (campo `h`) requerido para crear plantillas con HEADER multimedia.
 *
 * Flujo oficial:
 *  1) POST /{APP_ID}/uploads?file_length&file_type  -> { id: "upload:xxx" }
 *  2) POST /{UPLOAD_SESSION_ID} con header file_offset:0 y body binario -> { h: "4::..." }
 */
export const uploadWhatsAppMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({
      fileBase64: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      accountId: z.string().uuid(),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { data: account, error: accErr } = await context.supabase
      .from("whatsapp_accounts")
      .select("id, access_token, metadata")
      .eq("id", data.accountId)
      .maybeSingle();

    if (accErr || !account?.access_token) {
      throw new Error("UPLOAD_META_ERROR: No hay token válido para la cuenta de WhatsApp seleccionada.");
    }

    const metadata = (account.metadata as any) || {};
    const appId = metadata.app_id || process.env["META_APP_ID"] || process.env["WHATSAPP_APP_ID"];

    if (!appId) {
      throw new Error(
        "UPLOAD_META_ERROR: Falta el App ID de Meta (metadata.app_id de la cuenta o secreto META_APP_ID). Es obligatorio para obtener el header_handle."
      );
    }

    // Normalizar base64 (puede venir como data URL)
    const base64 = data.fileBase64.includes(",")
      ? data.fileBase64.split(",")[1]!
      : data.fileBase64;
    const binary = Buffer.from(base64, "base64");

    console.log("META_UPLOAD_START:", {
      fileName: data.fileName,
      fileType: data.fileType,
      fileLength: binary.length,
      appId: String(appId),
    });

    // 1) Crear sesión de subida
    const sessionRes = await fetch(
      `https://graph.facebook.com/v20.0/${appId}/uploads?file_length=${binary.length}&file_type=${encodeURIComponent(data.fileType)}&file_name=${encodeURIComponent(data.fileName)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${account.access_token}` },
      }
    );
    const sessionJson: any = await sessionRes.json();

    if (!sessionRes.ok || !sessionJson?.id) {
      const e = sessionJson?.error || {};
      throw new Error(
        `UPLOAD_META_ERROR
HTTP STATUS: ${sessionRes.status}
META ERROR CODE: ${e.code ?? "N/A"}
META ERROR TYPE: ${e.type ?? "N/A"}
META ERROR MESSAGE: ${e.message ?? "No se pudo crear la sesión de subida"}
FBTRACE_ID: ${e.fbtrace_id ?? "N/A"}`
      );
    }

    // 2) Subir bytes
    const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${sessionJson.id}`, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${account.access_token}`,
        file_offset: "0",
        "Content-Type": "application/octet-stream",
      },
      body: binary,
    });
    const uploadJson: any = await uploadRes.json();

    if (!uploadRes.ok || !uploadJson?.h) {
      const e = uploadJson?.error || {};
      throw new Error(
        `UPLOAD_META_ERROR
HTTP STATUS: ${uploadRes.status}
META ERROR CODE: ${e.code ?? "N/A"}
META ERROR TYPE: ${e.type ?? "N/A"}
META ERROR MESSAGE: ${e.message ?? "No se recibió header_handle de Meta"}
FBTRACE_ID: ${e.fbtrace_id ?? "N/A"}`
      );
    }

    console.log("META_UPLOAD_OK:", { sessionId: sessionJson.id, handleLength: String(uploadJson.h).length });

    return {
      mediaId: String(sessionJson.id),
      headerHandle: String(uploadJson.h),
      type: data.fileType.startsWith("image")
        ? "IMAGE"
        : data.fileType.startsWith("video")
        ? "VIDEO"
        : "DOCUMENT",
    };
  });
