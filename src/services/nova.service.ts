import { novaMock } from "./mocks/nova.mock";

export interface NovaMessage {
  from: "user" | "nova";
  text: string;
}

export interface NovaService {
  chat(prompt: string, history?: NovaMessage[]): Promise<NovaMessage>;
  suggestions(): Promise<string[]>;
  history(): Promise<NovaMessage[]>;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const novaService: NovaService = {
  async chat(prompt) {
    await wait(600);
    return novaMock.reply(prompt);
  },
  async suggestions() {
    return novaMock.suggestions();
  },
  async history() {
    return novaMock.history();
  },
};
