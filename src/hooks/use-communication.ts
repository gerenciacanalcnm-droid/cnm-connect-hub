import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationRepository } from "@/repositories/conversation.repository";
import { communicationRepository } from "@/repositories/communication.repository";
import { sendWhatsAppMessage } from "@/lib/communication.functions";
import { getWhatsAppConversations, getWhatsAppConversationMessages, sendWhatsAppReply } from "@/lib/whatsapp-inbox.functions";
import type { Conversation, ConversationMessage } from "@/types/communication";
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
    queryFn: async () => {
      // For the WhatsApp Inbox, we use the specialized fetcher
      const rows = await listFn({ 
        data: { 
          companyId: filters?.companyId,
          search: filters?.search
        } 
      });

      // Map to the common Conversation type
      return rows.map((r: any) => ({
        id: r.id,
        companyId: r.company_id,
        accountId: r.account_id,
        contactId: r.contact_id,
        channel: r.channel || 'whatsapp',
        contactPhone: r.contact_phone,
        contactName: r.contacts?.first_name ? `${r.contacts.first_name} ${r.contacts.last_name || ''}`.trim() : r.contact_name,
        status: r.status,
        assignedTo: r.assigned_to,
        tags: r.tags || [],
        unreadCount: r.unread_count || 0,
        lastMessageAt: r.last_message_at,
        lastMessagePreview: r.last_message_preview,
        createdAt: r.created_at,
      })) as Conversation[];
    },
  });
}

export function useConversationMessages(id: string | null) {
  const messagesFn = useServerFn(getWhatsAppConversationMessages);
  
  return useQuery({
    queryKey: queryKeys.conversationMessages(id ?? "none"),
    queryFn: async () => {
      if (!id) return [];
      const rows = await messagesFn({ data: { conversationId: id } });
      
      return rows.map((r: any) => ({
        id: r.id,
        conversationId: id,
        direction: r.direction,
        kind: r.media_url ? "image" : "text",
        body: r.body,
        mediaUrl: r.media_url,
        status: r.status,
        createdAt: r.created_at,
      })) as ConversationMessage[];
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
