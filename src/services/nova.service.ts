import { getNovaConversation, listNovaConversations, novaChat } from "@/lib/nova.functions";

export interface NovaMessage {
  from: "user" | "nova";
  text: string;
}

export interface NovaService {
  chat(prompt: string, history?: NovaMessage[]): Promise<NovaMessage>;
  suggestions(): Promise<string[]>;
  history(): Promise<NovaMessage[]>;
  reset(): void;
}

/** Conversación activa del asistente (se mantiene mientras dure la sesión de UI). */
let activeConversationId: string | null = null;

export const novaService: NovaService = {
  async chat(prompt) {
    try {
      const res = (await novaChat({
        data: { message: prompt, conversationId: activeConversationId },
      })) as { conversationId: string; answer: string };
      activeConversationId = res.conversationId;
      return { from: "nova", text: res.answer };
    } catch (err) {
      return {
        from: "nova",
        text: err instanceof Error ? err.message : "No pude procesar la consulta.",
      };
    }
  },
  async suggestions() {
    return [
      "¿Cuál es el estado de mis campañas?",
      "Muéstrame los KPIs de hoy",
      "Recomiéndame acciones para mejorar la entregabilidad",
      "¿Cuántos contactos tengo activos?",
    ];
  },
  async history() {
    try {
      if (!activeConversationId) {
        const conversations = (await listNovaConversations()) as { id: string }[];
        activeConversationId = conversations[0]?.id ?? null;
      }
      if (!activeConversationId) return [];
      const rows = (await getNovaConversation({ data: { id: activeConversationId } })) as {
        role: string;
        content: string;
      }[];
      return rows
        .filter((r) => r.role === "user" || r.role === "assistant")
        .map<NovaMessage>((r) => ({ from: r.role === "user" ? "user" : "nova", text: r.content }));
    } catch {
      return [];
    }
  },
  reset() {
    activeConversationId = null;
  },
};
