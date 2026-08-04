import { conversationService, type ConversationService } from "@/services/conversation.service";

export const conversationRepository: ConversationService = {
  list: (f) => conversationService.list(f),
  messages: (id) => conversationService.messages(id),
  update: (i) => conversationService.update(i),
};
