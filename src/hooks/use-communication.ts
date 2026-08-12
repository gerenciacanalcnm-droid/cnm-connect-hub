import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationRepository } from "@/repositories/conversation.repository";
import { communicationRepository } from "@/repositories/communication.repository";
import { sendWhatsAppMessage } from "@/lib/communication.functions";
import { getWhatsAppConversations, getWhatsAppConversationMessages, sendWhatsAppReply } from "@/lib/whatsapp-inbox.functions";
import type { Conversation } from "@/types/communication";
import { toast } from "sonner";
import { queryKeys } from "./queries/keys";
import { useServerFn } from "@tanstack/react-start";

export function useConversations(filters?: {
  channel?: Conversation["channel"];
  status?: Conversation["status"];
  search?: string;
  companyId?: string;
}) {
  const listFn = useServerFn(getWhatsAppConversations);
  
  return useQuery({
    queryKey: queryKeys.conversations(filters),
    queryFn: () => {
      // If we have a companyId, use the specialized WhatsApp Inbox fetcher
      if (filters?.companyId) {
        return listFn({ data: { companyId: filters.companyId } });
      }
      return conversationRepository.list(filters);
    },
  });
}

export function useConversationMessages(id: string | null) {
  const messagesFn = useServerFn(getWhatsAppConversationMessages);
  
  return useQuery({
    queryKey: queryKeys.conversationMessages(id ?? "none"),
    queryFn: () => {
      if (id) return messagesFn({ data: { conversationId: id } });
      return conversationRepository.messages(id as string);
    },
    enabled: Boolean(id),
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conversationRepository.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useChannelAnalytics() {
  return useQuery({
    queryKey: queryKeys.communication.analytics,
    queryFn: () => communicationRepository.analytics(),
  });
}

export function useCommunicationSettings() {
  return useQuery({
    queryKey: queryKeys.communication.settings,
    queryFn: () => communicationRepository.settings(),
  });
}

export function useCommunicationProviders() {
  return communicationRepository.providers();
}

export function useSendWhatsApp() {
  const qc = useQueryClient();
  const replyFn = useServerFn(sendWhatsAppReply);

  return useMutation({
    mutationFn: async (data: { to: string; body: string; accountId: string; conversationId?: string }) => {
      if (data.conversationId) {
        return replyFn({ 
          data: { 
            conversationId: data.conversationId, 
            body: data.body 
          } 
        });
      }
      return sendWhatsAppMessage({ data });
    },
    onSuccess: (_, variables) => {
      if (variables.conversationId) {
        qc.invalidateQueries({ queryKey: queryKeys.conversationMessages(variables.conversationId) });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
    onError: (error: any) => {
      if (error.message?.includes("saldo") || error.message?.includes("balance")) {
        toast.error("Saldo insuficiente");
      } else {
        toast.error("Error al enviar mensaje");
      }
    },
  });
}
