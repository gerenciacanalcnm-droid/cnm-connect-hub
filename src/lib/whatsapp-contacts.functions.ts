import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * Normaliza un número de teléfono al formato Meta E.164 (ej: 573051234567).
 * Si no tiene código de país, asume Colombia (57).
 */
export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export const syncContactToWhatsApp = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      companyId: z.string().uuid(),
      phone: z.string(),
      firstName: z.string(),
      lastName: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const whatsappPhone = normalizeWhatsAppPhone(data.phone);
    
    const { data: contact, error } = await supabase
      .from("contacts")
      .upsert({
        company_id: data.companyId,
        phone: data.phone,
        normalized_phone: whatsappPhone,
        first_name: data.firstName,
        last_name: data.lastName,
        whatsapp_phone: whatsappPhone,
        status: "active",
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "company_id, normalized_phone",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return contact;
  });

export const getWhatsAppContacts = createServerFn({ method: "GET" })
  .inputValidator((data) => 
    z.object({
      companyId: z.string().uuid(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("company_id", data.companyId)
      .not("normalized_phone", "is", null)
      .order("last_conversation_at", { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);
    return contacts;
  });
