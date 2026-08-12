import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CNM_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

const rowSchema = z.object({
  rowNumber: z.number().optional(),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  city: z.string().optional().default(""),
  company: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type Row = z.infer<typeof rowSchema>;

async function assertListOwnership(sb: any, listId: string) {
  const { data, error } = await sb
    .from("contact_lists")
    .select("id, name")
    .eq("id", listId)
    .eq("company_id", CNM_COMPANY_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("La lista no existe o no pertenece a esta empresa.");
  return data;
}

async function findExisting(sb: any, phones: string[], emails: string[]) {
  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();

  const chunk = <T,>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

  for (const part of chunk(phones.filter(Boolean), 200)) {
    const { data, error } = await sb
      .from("contacts")
      .select("id, phone, normalized_phone, email")
      .eq("company_id", CNM_COMPANY_ID)
      .or(`phone.in.(${part.join(",")}),normalized_phone.in.(${part.join(",")})`);
    if (error) throw new Error(error.message);
    for (const c of data ?? []) {
      if (c.phone) byPhone.set(String(c.phone), c.id);
      if (c.normalized_phone) byPhone.set(String(c.normalized_phone), c.id);
      if (c.email) byEmail.set(String(c.email).toLowerCase(), c.id);
    }
  }

  for (const part of chunk(emails.filter(Boolean), 200)) {
    const { data, error } = await sb
      .from("contacts")
      .select("id, phone, normalized_phone, email")
      .eq("company_id", CNM_COMPANY_ID)
      .in("email", part);
    if (error) throw new Error(error.message);
    for (const c of data ?? []) {
      if (c.email) byEmail.set(String(c.email).toLowerCase(), c.id);
      if (c.phone) byPhone.set(String(c.phone), c.id);
    }
  }

  return { byPhone, byEmail };
}

/** Analiza el lote antes de importar: cuántos contactos ya existen en la empresa. */
export const analyzeContactImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        list_id: z.string().uuid(),
        rows: z.array(rowSchema).max(20000),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const list = await assertListOwnership(sb, data.list_id);

    const { byPhone, byEmail } = await findExisting(
      sb,
      data.rows.map((r) => r.phone).filter(Boolean),
      data.rows.map((r) => r.email).filter(Boolean),
    );

    let existing = 0;
    for (const r of data.rows) {
      const id = (r.phone && byPhone.get(r.phone)) || (r.email && byEmail.get(r.email.toLowerCase()));
      if (id) existing++;
    }

    return {
      listName: list.name as string,
      existing,
      newContacts: data.rows.length - existing,
    };
  });

/** Importa un lote de contactos y los asocia a la lista destino. */
export const importContactsBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        list_id: z.string().uuid(),
        rows: z.array(rowSchema).max(500),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertListOwnership(sb, data.list_id);

    const result = { created: 0, updated: 0, associated: 0, errors: 0, errorRows: [] as { rowNumber: number; reason: string }[] };
    if (data.rows.length === 0) return result;

    const { byPhone, byEmail } = await findExisting(
      sb,
      data.rows.map((r) => r.phone).filter(Boolean),
      data.rows.map((r) => r.email).filter(Boolean),
    );

    const contactIds: string[] = [];

    for (const row of data.rows as Row[]) {
      try {
        const email = row.email ? row.email.toLowerCase() : null;
        const existingId = (row.phone && byPhone.get(row.phone)) || (email && byEmail.get(email)) || null;

        const attributes: Record<string, string> = {};
        if (row.city) attributes.city = row.city;
        if (row.company) attributes.company = row.company;
        if (row.notes) attributes.notes = row.notes;

        const payload: Record<string, any> = {
          company_id: CNM_COMPANY_ID,
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          email,
          updated_at: new Date().toISOString(),
        };
        if (row.phone) {
          payload.phone = row.phone;
          payload.normalized_phone = row.phone;
        }
        if (Object.keys(attributes).length > 0) payload.attributes = attributes;

        if (existingId) {
          const { error } = await sb
            .from("contacts")
            .update(payload)
            .eq("id", existingId)
            .eq("company_id", CNM_COMPANY_ID);
          if (error) throw new Error(error.message);
          contactIds.push(existingId);
          result.updated++;
        } else {
          if (!row.phone) payload.phone = email ?? "";
          const { data: inserted, error } = await sb
            .from("contacts")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          contactIds.push(inserted.id);
          if (row.phone) byPhone.set(row.phone, inserted.id);
          if (email) byEmail.set(email, inserted.id);
          result.created++;
        }
      } catch (e: any) {
        result.errors++;
        result.errorRows.push({ rowNumber: row.rowNumber ?? 0, reason: e?.message ?? "Error desconocido" });
      }
    }

    if (contactIds.length > 0) {
      const unique = Array.from(new Set(contactIds));
      const { error } = await sb
        .from("contact_list_members")
        .upsert(
          unique.map((contact_id) => ({ list_id: data.list_id, contact_id })),
          { onConflict: "list_id,contact_id", ignoreDuplicates: true },
        );
      if (error) throw new Error(error.message);
      result.associated = unique.length;
    }

    return result;
  });
