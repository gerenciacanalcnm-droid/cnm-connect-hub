import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationRepository } from "@/repositories/conversation.repository";
import { communicationRepository } from "@/repositories/communication.repository";
import type { Conversation } from "@/types/communication";
import { queryKeys } from "./queries/keys";

export function useConversations(filters?: {
  channel?: Conversation["channel"];
  status?: Conversation["status"];
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.conversations(filters),
    queryFn: () => conversationRepository.list(filters),
  });
}

export function useConversationMessages(id: string | null) {
  return useQuery({
    queryKey: queryKeys.conversationMessages(id ?? "none"),
    queryFn: () => conversationRepository.messages(id as string),
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
