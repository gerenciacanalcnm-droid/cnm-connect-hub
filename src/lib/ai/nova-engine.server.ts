/**
 * Nova AI Engine — capa de proveedor.
 *
 * Aísla completamente al resto de la plataforma del proveedor de IA.
 * Hoy se resuelve sobre el Gateway de Lovable AI (compatible OpenAI), y la
 * arquitectura permite añadir Azure OpenAI, Anthropic, Gemini directo,
 * Mistral o Perplexity implementando un nuevo `ProviderAdapter`.
 *
 * SERVIDOR ÚNICAMENTE. Nunca debe importarse desde componentes.
 */

export type NovaProvider =
  | "lovable"
  | "openai"
  | "azure-openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "perplexity";

export interface NovaEngineConfig {
  provider: NovaProvider;
  model: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retries: number;
  ragEnabled: boolean;
  ragTopK: number;
  toolsEnabled: boolean;
}

export interface NovaLimits {
  dailyRequests: number;
  monthlyRequests: number;
  dailyCost: number;
  monthlyCost: number;
  currency: string;
}

export const DEFAULT_ENGINE: NovaEngineConfig = {
  provider: "lovable",
  model: "google/gemini-3.6-flash",
  embeddingModel: "openai/text-embedding-3-small",
  temperature: 0.4,
  maxTokens: 1500,
  timeout: 45,
  retries: 2,
  ragEnabled: true,
  ragTopK: 6,
  toolsEnabled: true,
};

export const DEFAULT_LIMITS: NovaLimits = {
  dailyRequests: 500,
  monthlyRequests: 10000,
  dailyCost: 20,
  monthlyCost: 400,
  currency: "USD",
};

export const EMBEDDING_DIMENSIONS = 1536;

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export class NovaEngineError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NovaEngineError";
  }
}

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key)
    throw new NovaEngineError(
      "El motor de IA no está configurado (falta la clave del gateway).",
      500,
    );
  return key;
}

/** Sólo 429 y 5xx son reintentables; el resto es terminal. */
async function gatewayFetch(path: string, body: unknown, timeoutSeconds: number, retries: number) {
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    try {
      const res = await fetch(`${GATEWAY}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey(),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.ok) return (await res.json()) as Record<string, unknown>;

      const text = await res.text();
      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < retries) {
        attempt += 1;
        await new Promise((r) => setTimeout(r, 400 * attempt + Math.random() * 200));
        continue;
      }
      if (res.status === 429)
        throw new NovaEngineError(
          "Límite de solicitudes alcanzado. Intenta de nuevo en unos segundos.",
          429,
        );
      if (res.status === 402)
        throw new NovaEngineError("Créditos de IA agotados. Recarga el saldo del workspace.", 402);
      throw new NovaEngineError(
        `El motor de IA respondió ${res.status}: ${text.slice(0, 300)}`,
        res.status,
      );
    } catch (err) {
      if (err instanceof NovaEngineError) throw err;
      if (attempt < retries) {
        attempt += 1;
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      throw new NovaEngineError(
        err instanceof Error && err.name === "AbortError"
          ? "El motor de IA superó el tiempo de espera."
          : "No fue posible contactar al motor de IA.",
        504,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

// ── Tipos de conversación (formato OpenAI-compatible) ────────────────
export interface EngineMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | unknown[] | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

export interface EngineToolDef {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface EngineChatResult {
  message: {
    content: string | null;
    tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  };
  finishReason: string;
  tokensInput: number;
  tokensOutput: number;
}

export async function engineChat(
  cfg: NovaEngineConfig,
  messages: EngineMessage[],
  tools?: EngineToolDef[],
): Promise<EngineChatResult> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: cfg.temperature,
    max_completion_tokens: cfg.maxTokens,
  };
  if (cfg.model.startsWith("openai/gpt-5.6")) body["reasoning_effort"] = "none";
  if (tools && tools.length > 0) body["tools"] = tools;

  const json = await gatewayFetch("/chat/completions", body, cfg.timeout, cfg.retries);
  const choice = (json["choices"] as Array<Record<string, unknown>> | undefined)?.[0] ?? {};
  const usage = (json["usage"] as Record<string, number> | undefined) ?? {};
  return {
    message: (choice["message"] ?? { content: "" }) as EngineChatResult["message"],
    finishReason: String(choice["finish_reason"] ?? "stop"),
    tokensInput: usage["prompt_tokens"] ?? 0,
    tokensOutput: usage["completion_tokens"] ?? 0,
  };
}

export async function engineEmbed(cfg: NovaEngineConfig, input: string[]): Promise<number[][]> {
  if (input.length === 0) return [];
  const json = await gatewayFetch(
    "/embeddings",
    { model: cfg.embeddingModel, input, dimensions: EMBEDDING_DIMENSIONS },
    cfg.timeout,
    cfg.retries,
  );
  const rows = (json["data"] as Array<{ index: number; embedding: number[] }>) ?? [];
  return rows.sort((a, b) => a.index - b.index).map((r) => r.embedding);
}

/**
 * Costo estimado en USD. Tabla editable desde Configuración IA en el futuro;
 * hoy usa una referencia conservadora por millón de tokens.
 */
export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const table: Record<string, [number, number]> = {
    "google/gemini-3.6-flash": [0.3, 2.5],
    "google/gemini-3.1-flash-lite": [0.1, 0.4],
    "google/gemini-3.1-pro-preview": [1.25, 10],
    "openai/gpt-5.4-mini": [0.25, 2],
    "openai/gpt-5.5": [1.25, 10],
    "openai/text-embedding-3-small": [0.02, 0],
  };
  const [inRate, outRate] = table[model] ?? [0.3, 2.5];
  return (tokensIn / 1_000_000) * inRate + (tokensOut / 1_000_000) * outRate;
}
