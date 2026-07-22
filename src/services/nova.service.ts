export interface NovaMessage {
  from: "user" | "nova";
  text: string;
}

export interface NovaService {
  chat(prompt: string, history?: NovaMessage[]): Promise<NovaMessage>;
  suggestions(): Promise<string[]>;
}

export const novaService: NovaService = {
  async chat() {
    throw new Error("novaService.chat not implemented");
  },
  async suggestions() {
    return [];
  },
};
