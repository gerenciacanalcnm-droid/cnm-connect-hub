import { novaService, type NovaService } from "@/services/nova.service";

export const novaRepository: NovaService = {
  chat: (p, h) => novaService.chat(p, h),
  suggestions: () => novaService.suggestions(),
  history: () => novaService.history(),
  reset: () => novaService.reset(),
};
