export interface NovaMessage {
  from: "user" | "nova";
  text: string;
}

export interface NovaService {
  chat(prompt: string, history?: NovaMessage[]): Promise<NovaMessage>;
  suggestions(): Promise<string[]>;
  history(): Promise<NovaMessage[]>;
}

export const novaService: NovaService = {
  async chat(prompt) {
    return {
      from: "nova",
      text: "Nova aún no está conectada a la IA. Muy pronto podré responder a: “" + prompt + "”.",
    };
  },
  async suggestions() {
    return [
      "¿Cuál es el estado de mis campañas?",
      "Muéstrame los KPIs de hoy",
      "Recomiéndame acciones para mejorar la entregabilidad",
    ];
  },
  async history() {
    return [];
  },
};
