import type { Conversation, ConversationMessage } from "@/types/communication";
import {
  listConversations,
  listConversationMessages,
  updateConversation,
} from "@/lib/communication.functions";

type ConvRow = {
  id: string;
  company_id: string;
  account_id: string | null;
  contact_id: string | null;
  channel: string;
  contact_phone: string;
  contact_name: string | null;
  contact: { name: string; whatsapp_phone: string } | null;
  status: string;
  assigned_to: string | null;
  tags: string[] | null;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

function mapConv(r: ConvRow): Conversation {
  return {
    id: r.id,
    companyId: r.company_id,
    accountId: r.account_id ?? undefined,
    contactId: r.contact_id ?? undefined,
    channel: r.channel as Conversation["channel"],
    contactPhone: r.contact_phone,
    contactName: r.contact?.name ?? r.contact_name ?? undefined,
    status: r.status as Conversation["status"],
    assignedTo: r.assigned_to ?? undefined,
    tags: r.tags ?? [],
    unreadCount: r.unread_count,
    lastMessageAt: r.last_message_at ?? undefined,
    lastMessagePreview: r.last_message_preview ?? undefined,
    createdAt: r.created_at,
  };
}

export interface ConversationService {
  list(filters?: {
    channel?: Conversation["channel"];
    status?: Conversation["status"];
    search?: string;
  }): Promise<Conversation[]>;
  messages(conversationId: string): Promise<ConversationMessage[]>;
  update(input: {
    id: string;
    status?: Conversation["status"];
    assignedTo?: string | null;
    tags?: string[];
  }): Promise<void>;
}

export const conversationService: ConversationService = {
  async list(filters) {
    try {
      const rows = (await listConversations({ data: filters ?? {} })) as ConvRow[];
      return rows.map(mapConv);
    } catch (err) {
      console.error("[conversationService] list:", err);
      return [];
    }
  },
  async messages(conversationId) {
    try {
      const rows = (await listConversationMessages({ data: { conversationId } })) as any[];

      return rows.map((r) => ({
        id: String(r["id"]),
        conversationId,
        direction: (r["direction"] as ConversationMessage["direction"]) ?? "outbound",
        kind: (r["media_url"] ? "image" : "text") as ConversationMessage["kind"],
        body: (r["body"] as string | null) ?? undefined,
        mediaUrl: (r["media_url"] as string | null) ?? undefined,
        status: String(r["status"] ?? "sent"),
        createdAt: String(r["created_at"]),
      }));
    } catch (err) {
      console.error("[conversationService] messages:", err);
      return [];
    }
  },
  async update(input) {
    await updateConversation({ data: input });
  },
};
