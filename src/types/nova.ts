export type NovaDocumentStatus = "pending" | "processing" | "ready" | "error" | "unsupported";

export interface NovaDocument {
  id: string;
  company_id: string | null;
  name: string;
  category: string;
  source_type: string;
  mime_type: string | null;
  storage_path: string | null;
  source_url: string | null;
  size_bytes: number;
  version: number;
  status: NovaDocumentStatus | string;
  error: string | null;
  chunk_count: number;
  token_count: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NovaPrompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  content: string;
  version: number;
  is_active: boolean;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NovaPromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  note: string | null;
  created_at: string;
}

export interface NovaTool {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  required_permission: string | null;
  min_role: string;
  is_enabled: boolean;
  is_ready: boolean;
}

export interface NovaAiLog {
  id: string;
  company_id: string | null;
  user_id: string | null;
  conversation_id: string | null;
  provider: string;
  model: string;
  prompt: string;
  response: string;
  tokens_input: number;
  tokens_output: number;
  cost: number;
  latency_ms: number;
  status: string;
  error: string | null;
  created_at: string;
}

export interface NovaAnalytics {
  requests: number;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  activeUsers: number;
  avgLatencyMs: number;
  errors: number;
  daily: { date: string; requests: number; cost: number; tokens: number }[];
  byModel: { model: string; requests: number; cost: number }[];
}

export interface NovaEngineSettings {
  provider: string;
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

export interface NovaLimitSettings {
  dailyRequests: number;
  monthlyRequests: number;
  dailyCost: number;
  monthlyCost: number;
  currency: string;
}

export interface NovaPermissionSettings {
  useAi: string[];
  knowledgeBase: string[];
  tools: string[];
  upload: string[];
  administration: string[];
}

export interface NovaConversation {
  id: string;
  title: string | null;
  model: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovaChatMessage {
  id?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface NovaChatReply {
  conversationId: string;
  answer: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  latencyMs: number;
  toolsUsed: string[];
  sources: { documentId: string; name: string; similarity: number }[];
}

export interface NovaMemoryEntry {
  id: string;
  scope: string;
  company_id: string | null;
  user_id: string | null;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export const NOVA_MODEL_CATALOG = [
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash", provider: "google", note: "Rápido y equilibrado" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", provider: "google", note: "Alto volumen, bajo costo" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "google", note: "Razonamiento avanzado" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini", provider: "openai", note: "Equilibrio costo/calidad" },
  { id: "openai/gpt-5.5", label: "GPT-5.5", provider: "openai", note: "Máxima calidad" },
] as const;

export const NOVA_PROVIDERS = [
  { id: "lovable", label: "Lovable AI Gateway", status: "active" },
  { id: "openai", label: "OpenAI", status: "planned" },
  { id: "azure-openai", label: "Azure OpenAI", status: "planned" },
  { id: "anthropic", label: "Anthropic", status: "planned" },
  { id: "google", label: "Google Gemini (directo)", status: "planned" },
  { id: "mistral", label: "Mistral", status: "planned" },
  { id: "perplexity", label: "Perplexity", status: "planned" },
] as const;

export const NOVA_DOC_CATEGORIES = [
  "documentacion",
  "faq",
  "manual",
  "catalogo",
  "contrato",
  "politica",
  "procedimiento",
  "tutorial",
] as const;
