import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Database } from "@/integrations/supabase/types";

type WhatsAppConversation = Database['public']['Tables']['whatsapp_conversations']['Row'];
type WhatsAppMessage = Database['public']['Tables']['whatsapp_messages']['Row'];
type Contact = Database['public']['Tables']['contacts']['Row'];
type WhatsAppAccount = Database['public']['Tables']['whatsapp_accounts']['Row'];

export interface ConversationWithDetails extends WhatsAppConversation {
  contacts: Contact | null;
  whatsapp_accounts: WhatsAppAccount | null;
}

/**
 * Fetch all conversations for the current company.
 */
export const getWhatsAppConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ 
    companyId: z.string().uuid().optional(),
    search: z.string().optional()
  }).parse(v || {}))
  .handler(async ({ data, context }) => {
    let companyId = data.companyId;

    if (!companyId) {
      const { data: membership } = await context.supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", context.userId)
        .eq("is_active", true)
        .maybeSingle();
      
      companyId = membership?.company_id;
    }

    if (!companyId) return [];

    let q = context.supabase
      .from("whatsapp_conversations")
      .select(`
        *,
        contacts!whatsapp_conversations_contact_id_fkey (
          id,
          first_name,
          last_name,
          phone,
          whatsapp_phone,
          status
        ),
        whatsapp_accounts (
          id,
          alias,
          display_phone
        )
      `)
      .eq("company_id", companyId)
      .order("last_message_at", { ascending: false });

    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`contact_phone.ilike.${s},contact_name.ilike.${s}`);
    }

    const { data: conversations, error } = await q;

    if (error) {
      console.error("[getWhatsAppConversations] Error:", error);
      throw new Error(error.message);
    }
    
    return (conversations || []) as unknown as ConversationWithDetails[];
  });

/**
 * Fetch messages for a specific conversation.
 */
export const getWhatsAppConversationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ conversationId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    // Mark conversation as read
    await context.supabase
      .from("whatsapp_conversations")
      .update({ unread_count: 0 })
      .eq("id", data.conversationId);

    return (messages || []) as WhatsAppMessage[];
  });

/**
 * Send a reply message in a conversation.
 */
export const sendWhatsAppReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    conversationId: z.string().uuid(),
    body: z.string().min(1)
  }).parse(v))
  .handler(async ({ data, context }) => {
    // 1. Get conversation details to find company and account
    const { data: conv, error: convError } = await context.supabase
      .from("whatsapp_conversations")
      .select("company_id, account_id, contact_phone")
      .eq("id", data.conversationId)
      .single();

    if (convError || !conv) throw new Error("Conversación no encontrada");

    // Re-use the individual send logic but adapted for inbox context
    // This will handle Wallet, Meta API, etc.
    const { sendWhatsAppIndividual } = await import("./whatsapp.functions");
    
    return await sendWhatsAppIndividual({
      data: {
        accountId: conv.account_id!,
        recipient: conv.contact_phone,
        body: data.body,
        // We'll pass conversationId if the function supports it to link the message
      }
    });
  });
