/**
 * CNM Nova — Server Functions.
 *
 * Única frontera entre la plataforma y el motor de IA.
 * Component → Hook → Repository → Service → Server Function → AI Engine → Proveedor.
 *
 * El frontend jamás contacta al proveedor de IA directamente.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  DEFAULT_ENGINE,
  DEFAULT_LIMITS,
  NovaEngineError,
  engineChat,
  engineEmbed,
  estimateCost,
  type EngineMessage,
  type NovaEngineConfig,
  type NovaLimits,
} from "@/lib/ai/nova-engine.server";
import { NOVA_TOOL_IMPLS, buildToolDefs, type ToolRow } from "@/lib/ai/nova-tools.server";
import {
  AI_EXTRACT_EXTENSIONS,
  TEXT_EXTENSIONS,
  arrayBufferToBase64,
  chunkText,
  estimateTokens,
  extensionOf,
  extractWithAi,
  stripHtml,
} from "@/lib/ai/nova-extract.server";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";
const BUCKET = "nova-knowledge";

/** Cliente Supabase con tipado laxo: las cadenas dinámicas de PostgREST
 *  (namespaces/keys de settings, RPC) no son expresables con los tipos generados. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

// ═══════════════════ CONFIGURACIÓN (Settings Engine) ═══════════════════
async function readSection<T>(supabase: LooseSupabase, key: string, fallback: T): Promise<T> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .is("company_id", null)
    .eq("namespace", "nova")
    .eq("key", key)
    .maybeSingle();
  const value = data?.value as Partial<T> | undefined;
  return value && typeof value === "object" ? { ...fallback, ...value } : fallback;
}

export const getNovaSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [engine, limits, permissions] = await Promise.all([
      readSection(context.supabase as never, "engine", DEFAULT_ENGINE),
      readSection(context.supabase as never, "limits", DEFAULT_LIMITS),
      readSection(context.supabase as never, "permissions", {
        useAi: ["super_admin", "company_admin", "manager", "agent"],
        knowledgeBase: ["super_admin", "company_admin"],
        tools: ["super_admin", "company_admin", "manager"],
        upload: ["super_admin", "company_admin"],
        administration: ["super_admin"],
      }),
    ]);
    return JSON.stringify({ engine, limits, permissions });
  });

export const saveNovaSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ key: z.enum(["engine", "limits", "permissions"]), value: z.unknown() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("settings").upsert(
      {
        company_id: null,
        namespace: "nova",
        key: data.key,
        value: data.value as never,
        is_public: false,
      },
      { onConflict: "company_id,namespace,key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ KNOWLEDGE BASE ═══════════════════
export const listNovaDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("nova_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getNovaUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ filename: z.string().min(1) }).parse(v))
  .handler(async ({ data, context }) => {
    const safe = data.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${CNM_COMPANY_ID}/${Date.now()}-${safe}`;
    const { data: signed, error } = await context.supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

const DocumentInput = z.object({
  name: z.string().min(1),
  category: z.string().min(1).default("documentacion"),
  sourceType: z.enum(["file", "url", "text"]).default("file"),
  storagePath: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  sizeBytes: z.number().int().min(0).default(0),
});

export const createNovaDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => DocumentInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("nova_documents")
      .insert({
        company_id: CNM_COMPANY_ID,
        name: data.name,
        category: data.category,
        source_type: data.sourceType,
        storage_path: data.storagePath ?? null,
        source_url: data.sourceUrl ?? null,
        mime_type: data.mimeType ?? null,
        size_bytes: data.sizeBytes || (data.content?.length ?? 0),
        status: "pending",
        author_id: context.userId,
        metadata: data.content ? ({ inlineContent: data.content } as never) : ({} as never),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

/** Extrae texto, trocea, genera embeddings y deja el documento listo para RAG. */
export const processNovaDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: doc, error } = await sb
      .from("nova_documents")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const fail = async (message: string, status = "error") => {
      await sb
        .from("nova_documents")
        .update({ status, error: message, chunk_count: 0 })
        .eq("id", data.id);
      return { ok: false, error: message };
    };

    await sb.from("nova_documents").update({ status: "processing", error: null }).eq("id", data.id);
    await sb.from("nova_chunks").delete().eq("document_id", data.id);

    const cfg = await readSection(sb as never, "engine", DEFAULT_ENGINE);
    let text = "";

    try {
      if (doc.source_type === "text") {
        text = String((doc.metadata as Record<string, unknown> | null)?.["inlineContent"] ?? "");
      } else if (doc.source_type === "url" && doc.source_url) {
        const res = await fetch(doc.source_url, { headers: { "User-Agent": "CNM-Nova/1.0" } });
        if (!res.ok) return await fail(`La URL respondió ${res.status}.`);
        text = stripHtml(await res.text());
      } else if (doc.storage_path) {
        const { data: file, error: dlErr } = await sb.storage
          .from(BUCKET)
          .download(doc.storage_path);
        if (dlErr || !file) return await fail(dlErr?.message ?? "No se pudo descargar el archivo.");
        const ext = extensionOf(doc.name);
        if (TEXT_EXTENSIONS.includes(ext)) {
          const raw = await file.text();
          text = ext === "html" || ext === "htm" ? stripHtml(raw) : raw;
        } else if (AI_EXTRACT_EXTENSIONS.includes(ext)) {
          const buffer = await file.arrayBuffer();
          if (buffer.byteLength > 12 * 1024 * 1024) {
            return await fail("El PDF supera 12 MB. Divídelo antes de subirlo.");
          }
          text = await extractWithAi(
            cfg,
            arrayBufferToBase64(buffer),
            doc.mime_type ?? "application/pdf",
            doc.name,
          );
        } else {
          return await fail(
            `El formato .${ext} aún no tiene extractor automático. Conviértelo a PDF, TXT, MD o CSV y vuelve a subirlo.`,
            "unsupported",
          );
        }
      } else {
        return await fail("El documento no tiene contenido asociado.");
      }

      const chunks = chunkText(text);
      if (chunks.length === 0) return await fail("No se pudo extraer texto legible del documento.");

      let stored = 0;
      let tokens = 0;
      for (let i = 0; i < chunks.length; i += 64) {
        const batch = chunks.slice(i, i + 64);
        const vectors = await engineEmbed(cfg, batch);
        const rows = batch.map((content, j) => ({
          document_id: data.id,
          company_id: doc.company_id,
          chunk_index: i + j,
          content,
          token_count: estimateTokens(content),
          embedding: JSON.stringify(vectors[j] ?? []) as never,
        }));
        const { error: insErr } = await sb.from("nova_chunks").insert(rows as never);
        if (insErr) return await fail(insErr.message);
        stored += rows.length;
        tokens += rows.reduce((a, r) => a + r.token_count, 0);
      }

      await sb
        .from("nova_documents")
        .update({ status: "ready", error: null, chunk_count: stored, token_count: tokens })
        .eq("id", data.id);
      return { ok: true, chunks: stored, tokens };
    } catch (err) {
      return await fail(
        err instanceof Error ? err.message : "Error desconocido al procesar el documento.",
      );
    }
  });

export const deleteNovaDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("nova_documents")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (doc?.storage_path) await context.supabase.storage.from(BUCKET).remove([doc.storage_path]);
    const { error } = await context.supabase.from("nova_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ PROMPTS ═══════════════════
export const listNovaPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("nova_prompts")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listNovaPromptVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ promptId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("nova_prompt_versions")
      .select("*")
      .eq("prompt_id", data.promptId)
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveNovaPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid().optional(),
        key: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        content: z.string().min(1),
        isActive: z.boolean().default(true),
        note: z.string().optional().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    if (!data.id) {
      const { data: created, error } = await sb
        .from("nova_prompts")
        .insert({
          company_id: null,
          key: data.key,
          name: data.name,
          description: data.description ?? null,
          content: data.content,
          is_active: data.isActive,
          created_by: context.userId,
        })
        .select("id, version")
        .single();
      if (error) throw new Error(error.message);
      await sb.from("nova_prompt_versions").insert({
        prompt_id: created.id,
        version: 1,
        content: data.content,
        note: data.note ?? "Versión inicial",
        created_by: context.userId,
      });
      return { id: created.id, version: 1 };
    }

    const { data: current, error: curErr } = await sb
      .from("nova_prompts")
      .select("version, content")
      .eq("id", data.id)
      .single();
    if (curErr) throw new Error(curErr.message);

    const changed = current.content !== data.content;
    const nextVersion = changed ? current.version + 1 : current.version;

    const { error } = await sb
      .from("nova_prompts")
      .update({
        name: data.name,
        description: data.description ?? null,
        content: data.content,
        is_active: data.isActive,
        version: nextVersion,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (changed) {
      await sb.from("nova_prompt_versions").insert({
        prompt_id: data.id,
        version: nextVersion,
        content: data.content,
        note: data.note ?? null,
        created_by: context.userId,
      });
    }
    return { id: data.id, version: nextVersion };
  });

export const duplicateNovaPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: src, error } = await sb
      .from("nova_prompts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: copy, error: insErr } = await sb
      .from("nova_prompts")
      .insert({
        company_id: null,
        key: `${src.key}-copia-${Date.now().toString(36)}`,
        name: `${src.name} (copia)`,
        description: src.description,
        content: src.content,
        is_active: false,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    await sb.from("nova_prompt_versions").insert({
      prompt_id: copy.id,
      version: 1,
      content: src.content,
      note: `Duplicado de ${src.name}`,
      created_by: context.userId,
    });
    return { id: copy.id };
  });

export const restoreNovaPromptVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ promptId: z.string().uuid(), versionId: z.string().uuid() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: version, error } = await sb
      .from("nova_prompt_versions")
      .select("content, version")
      .eq("id", data.versionId)
      .single();
    if (error) throw new Error(error.message);
    const { data: prompt } = await sb
      .from("nova_prompts")
      .select("version")
      .eq("id", data.promptId)
      .single();
    const nextVersion = (prompt?.version ?? 1) + 1;
    await sb
      .from("nova_prompts")
      .update({ content: version.content, version: nextVersion })
      .eq("id", data.promptId);
    await sb.from("nova_prompt_versions").insert({
      prompt_id: data.promptId,
      version: nextVersion,
      content: version.content,
      note: `Restaurado desde la versión ${version.version}`,
      created_by: context.userId,
    });
    return { ok: true, version: nextVersion };
  });

export const deleteNovaPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nova_prompts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ HERRAMIENTAS ═══════════════════
export const listNovaTools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("nova_tools")
      .select("*")
      .order("category")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateNovaTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        is_enabled: z.boolean().optional(),
        min_role: z.enum(["viewer", "agent", "manager", "company_admin", "super_admin"]).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.is_enabled !== undefined) patch["is_enabled"] = data.is_enabled;
    if (data.min_role) patch["min_role"] = data.min_role;
    const { error } = await context.supabase
      .from("nova_tools")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ LOGS Y ANALYTICS ═══════════════════
export const listNovaLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(25),
        status: z.string().optional(),
        search: z.string().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    let q = context.supabase
      .from("nova_ai_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + data.pageSize - 1);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.ilike("prompt", `%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const getNovaAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ days: z.number().int().min(1).max(90).default(30) }).parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.days * 86400000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("nova_ai_logs")
      .select("user_id, model, tokens_input, tokens_output, cost, latency_ms, status, created_at")
      .gte("created_at", since);
    if (error) throw new Error(error.message);
    const list = rows ?? [];

    const dailyMap = new Map<string, { requests: number; cost: number; tokens: number }>();
    const modelMap = new Map<string, { requests: number; cost: number }>();
    const users = new Set<string>();
    let tokensInput = 0;
    let tokensOutput = 0;
    let cost = 0;
    let latency = 0;
    let errors = 0;

    for (const r of list) {
      const date = r.created_at.slice(0, 10);
      const day = dailyMap.get(date) ?? { requests: 0, cost: 0, tokens: 0 };
      day.requests += 1;
      day.cost += Number(r.cost ?? 0);
      day.tokens += (r.tokens_input ?? 0) + (r.tokens_output ?? 0);
      dailyMap.set(date, day);

      const m = modelMap.get(r.model) ?? { requests: 0, cost: 0 };
      m.requests += 1;
      m.cost += Number(r.cost ?? 0);
      modelMap.set(r.model, m);

      if (r.user_id) users.add(r.user_id);
      tokensInput += r.tokens_input ?? 0;
      tokensOutput += r.tokens_output ?? 0;
      cost += Number(r.cost ?? 0);
      latency += r.latency_ms ?? 0;
      if (r.status !== "success") errors += 1;
    }

    return {
      requests: list.length,
      tokensInput,
      tokensOutput,
      cost,
      activeUsers: users.size,
      avgLatencyMs: list.length ? Math.round(latency / list.length) : 0,
      errors,
      daily: [...dailyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
      byModel: [...modelMap.entries()]
        .map(([model, v]) => ({ model, ...v }))
        .sort((a, b) => b.requests - a.requests),
    };
  });

// ═══════════════════ CONVERSACIONES ═══════════════════
export const listNovaConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("nova_conversations")
      .select("id, title, model, is_favorite, created_at, updated_at")
      .eq("user_id", context.userId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getNovaConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("nova_messages")
      .select("id, role, content, created_at, metadata")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateNovaConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().optional(),
        isFavorite: z.boolean().optional(),
        archived: z.boolean().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch["title"] = data.title;
    if (data.isFavorite !== undefined) patch["is_favorite"] = data.isFavorite;
    if (data.archived !== undefined)
      patch["archived_at"] = data.archived ? new Date().toISOString() : null;
    const { error } = await context.supabase
      .from("nova_conversations")
      .update(patch as never)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNovaConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("nova_conversations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ MEMORIA ═══════════════════
export const listNovaMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("nova_memory")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertNovaMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        scope: z.enum(["company", "user"]),
        key: z.string().min(1),
        value: z.record(z.string(), z.unknown()),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nova_memory").upsert(
      {
        scope: data.scope,
        company_id: data.scope === "company" ? CNM_COMPANY_ID : null,
        user_id: data.scope === "user" ? context.userId : null,
        key: data.key,
        value: data.value as never,
      } as never,
      { onConflict: "scope,company_id,user_id,key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNovaMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nova_memory").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════ CHAT (RAG + Tools) ═══════════════════
async function resolveRole(sb: LooseSupabase, userId: string): Promise<string> {
  const { data: superAdmin } = await sb.rpc("is_super_admin", { _user_id: userId });
  if (superAdmin) return "super_admin";
  const { data: member } = await sb
    .from("company_members")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", CNM_COMPANY_ID)
    .eq("is_active", true)
    .maybeSingle();
  return member?.role ?? "viewer";
}

export const novaChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        message: z.string().min(1).max(8000),
        conversationId: z.string().uuid().optional().nullable(),
        model: z.string().optional().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const started = Date.now();

    const cfg: NovaEngineConfig = await readSection(sb as never, "engine", DEFAULT_ENGINE);
    const limits: NovaLimits = await readSection(sb as never, "limits", DEFAULT_LIMITS);
    if (data.model) cfg.model = data.model;

    // ── Límites de uso ────────────────────────────────────────────
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { data: todayLogs } = await sb
      .from("nova_ai_logs")
      .select("cost")
      .gte("created_at", dayStart.toISOString());
    const todayCount = todayLogs?.length ?? 0;
    const todayCost = (todayLogs ?? []).reduce((a, r) => a + Number(r.cost ?? 0), 0);
    if (todayCount >= limits.dailyRequests) {
      throw new Error(
        "Se alcanzó el límite diario de consultas a la IA configurado por el administrador.",
      );
    }
    if (todayCost >= limits.dailyCost) {
      throw new Error(
        "Se alcanzó el límite diario de costo de IA configurado por el administrador.",
      );
    }

    // ── Conversación ──────────────────────────────────────────────
    let conversationId = data.conversationId ?? null;
    if (!conversationId) {
      const { data: conv, error } = await sb
        .from("nova_conversations")
        .insert({
          company_id: CNM_COMPANY_ID,
          user_id: context.userId,
          title: data.message.slice(0, 70),
          model: cfg.model,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = conv.id;
    }

    // ── Historial ─────────────────────────────────────────────────
    const { data: history } = await sb
      .from("nova_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);

    // ── Prompts administrables ────────────────────────────────────
    const { data: prompts } = await sb
      .from("nova_prompts")
      .select("key, content, is_active")
      .in("key", ["system", "company", "user"])
      .eq("is_active", true);
    const promptText = (prompts ?? []).map((p) => p.content).join("\n\n");

    // ── Memoria ───────────────────────────────────────────────────
    const { data: memory } = await sb
      .from("nova_memory")
      .select("scope, key, value")
      .or(`user_id.eq.${context.userId},company_id.eq.${CNM_COMPANY_ID}`)
      .limit(20);
    const memoryText = (memory ?? [])
      .map((m) => `- [${m.scope}] ${m.key}: ${JSON.stringify(m.value)}`)
      .join("\n");

    // ── RAG ───────────────────────────────────────────────────────
    const sources: { documentId: string; name: string; similarity: number }[] = [];
    let ragText = "";
    if (cfg.ragEnabled) {
      try {
        const [queryVector] = await engineEmbed(cfg, [data.message]);
        if (queryVector) {
          const { data: matches } = await sb.rpc("match_nova_chunks", {
            query_embedding: JSON.stringify(queryVector) as never,
            match_company_id: CNM_COMPANY_ID,
            match_count: cfg.ragTopK,
          });
          const rows = (matches ?? []) as {
            document_id: string;
            content: string;
            similarity: number;
          }[];
          if (rows.length > 0) {
            const ids = [...new Set(rows.map((r) => r.document_id))];
            const { data: docs } = await sb.from("nova_documents").select("id, name").in("id", ids);
            const nameOf = new Map((docs ?? []).map((d) => [d.id, d.name]));
            for (const r of rows) {
              sources.push({
                documentId: r.document_id,
                name: nameOf.get(r.document_id) ?? "Documento",
                similarity: Number(r.similarity.toFixed(3)),
              });
            }
            ragText = rows
              .map(
                (r, i) => `[${i + 1}] (${nameOf.get(r.document_id) ?? "Documento"})\n${r.content}`,
              )
              .join("\n\n");
          }
        }
      } catch (err) {
        console.error("[novaChat] RAG no disponible:", err);
      }
    }

    // ── Herramientas con RBAC ─────────────────────────────────────
    const role = await resolveRole(sb, context.userId);
    let toolDefs: ReturnType<typeof buildToolDefs> = [];
    if (cfg.toolsEnabled) {
      const { data: toolRows } = await sb
        .from("nova_tools")
        .select("code, name, description, min_role, is_enabled, is_ready");
      toolDefs = buildToolDefs((toolRows ?? []) as ToolRow[], role);
    }

    const system = [
      promptText ||
        "Eres CNM Nova, el copiloto de IA de la plataforma SMS CNM. Responde en español, breve y accionable.",
      `Rol del usuario actual: ${role}. No reveles información fuera de su alcance.`,
      memoryText ? `Memoria relevante:\n${memoryText}` : "",
      ragText
        ? `Fragmentos de la base de conocimiento (úsalos como fuente principal y cita el número entre corchetes):\n${ragText}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const messages: EngineMessage[] = [
      { role: "system", content: system },
      ...(history ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: data.message },
    ];

    // ── Ciclo de herramientas ─────────────────────────────────────
    const toolsUsed: string[] = [];
    let tokensInput = 0;
    let tokensOutput = 0;
    let answer = "";

    try {
      for (let step = 0; step < 5; step += 1) {
        const result = await engineChat(cfg, messages, toolDefs.length ? toolDefs : undefined);
        tokensInput += result.tokensInput;
        tokensOutput += result.tokensOutput;

        const calls = result.message.tool_calls ?? [];
        if (calls.length === 0) {
          answer = typeof result.message.content === "string" ? result.message.content : "";
          break;
        }

        messages.push({
          role: "assistant",
          content: result.message.content ?? "",
          tool_calls: calls,
        });
        for (const call of calls) {
          const impl = NOVA_TOOL_IMPLS[call.function.name];
          let output: unknown;
          if (!impl) {
            output = { error: "Herramienta no disponible." };
          } else {
            toolsUsed.push(call.function.name);
            try {
              const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
              output = await impl.run(
                { supabase: sb as never, companyId: CNM_COMPANY_ID, userId: context.userId },
                args,
              );
            } catch (err) {
              output = {
                error: err instanceof Error ? err.message : "Fallo al ejecutar la herramienta.",
              };
            }
          }
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(output).slice(0, 6000),
          });
        }
      }

      if (!answer)
        answer = "No pude completar la respuesta. Reformula la pregunta o inténtalo de nuevo.";

      const latencyMs = Date.now() - started;
      const cost = estimateCost(cfg.model, tokensInput, tokensOutput);

      await sb.from("nova_messages").insert([
        { conversation_id: conversationId, role: "user" as never, content: data.message },
        {
          conversation_id: conversationId,
          role: "assistant" as never,
          content: answer,
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          metadata: { toolsUsed, sources, model: cfg.model } as never,
        },
      ] as never);

      await sb.from("nova_conversations").update({ model: cfg.model }).eq("id", conversationId);

      await sb.from("nova_ai_logs").insert({
        company_id: CNM_COMPANY_ID,
        user_id: context.userId,
        conversation_id: conversationId,
        provider: cfg.provider,
        model: cfg.model,
        prompt: data.message,
        response: answer,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        cost,
        latency_ms: latencyMs,
        status: "success",
        tool_calls: toolsUsed as never,
      });

      return {
        conversationId,
        answer,
        model: cfg.model,
        tokensInput,
        tokensOutput,
        cost,
        latencyMs,
        toolsUsed,
        sources,
      };
    } catch (err) {
      const message =
        err instanceof NovaEngineError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error del motor de IA.";
      await sb.from("nova_ai_logs").insert({
        company_id: CNM_COMPANY_ID,
        user_id: context.userId,
        conversation_id: conversationId,
        provider: cfg.provider,
        model: cfg.model,
        prompt: data.message,
        response: "",
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        cost: estimateCost(cfg.model, tokensInput, tokensOutput),
        latency_ms: Date.now() - started,
        status: "error",
        error: message,
      });
      throw new Error(message);
    }
  });
