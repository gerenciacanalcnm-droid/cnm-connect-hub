import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { MessageStatus } from "@/integrations/supabase/types";

/**
 * Fetch all conversations for the current company.
 */
export const getWhatsAppConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ companyId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: conversations, error } = await context.supabase
      .from("whatsapp_conversations")
      .select(`
        *,
        contacts (
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
      .eq("company_id", data.companyId)
      .order("last_message_at", { ascending: false });

    if (error) throw new Error(error.message);
    return conversations;
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

    return messages;
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
        companyId: conv.company_id,
        accountId: conv.account_id,
        to: conv.contact_phone,
        message: data.body,
        conversationId: data.conversationId
      }
    });
  });
