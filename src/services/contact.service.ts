import type { Contact } from "@/types/contact";
import type { Paginated, QueryParams } from "@/types/common";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getContactImportUploadUrl,
  importContactsCsv,
} from "@/lib/platform.functions";

export interface ContactInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  tags?: string[];
}

export interface ContactService {
  list(params?: QueryParams & { tag?: string }): Promise<Paginated<Contact>>;
  getById(id: string): Promise<Contact | undefined>;
  create(input: ContactInput): Promise<Contact>;
  update(id: string, patch: Partial<Contact>): Promise<Contact>;
  remove(id: string): Promise<void>;
  bulkImport(file: File): Promise<{ imported: number; duplicates: number; errors: number }>;
}

type Row = {
  id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
  tags: string[] | null;
  created_at: string;
  preferred_channel?: string | null;
  whatsapp_phone?: string | null;
  status?: string | null;
  last_conversation_at?: string | null;
};

function mapRow(r: Row): Contact {
  return {
    id: r.id,
    companyId: r.company_id,
    firstName: r.first_name ?? "",
    lastName: r.last_name ?? undefined,
    phone: r.phone,
    email: r.email ?? undefined,
    tags: r.tags ?? [],
    createdAt: r.created_at,
    preferredChannel: (r.preferred_channel ?? "sms") as Contact["preferredChannel"],
    whatsappPhone: r.whatsapp_phone ?? undefined,
    status: r.status ?? "active",
    lastConversationAt: r.last_conversation_at ?? undefined,
  };
}

export const contactService: ContactService = {
  async list(params) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    try {
      const res = (await listContacts({
        data: { page, pageSize, search: params?.search, tag: params?.tag },
      })) as { rows: Row[]; total: number };
      const items = res.rows.map(mapRow);
      const totalPages = Math.max(1, Math.ceil(res.total / pageSize));
      return { items, pagination: { page, pageSize, total: res.total, totalPages } };
    } catch (err) {
      console.error("[contactService] list error:", err);
      return { items: [], pagination: { page, pageSize, total: 0, totalPages: 1 } };
    }
  },
  async getById(id) {
    const all = await this.list({ pageSize: 200 });
    return all.items.find((c) => c.id === id);
  },
  async create(input) {
    const row = (await createContact({
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
        email: input.email,
        tags: input.tags ?? [],
      },
    })) as Row;
    return mapRow(row);
  },
  async update(id, patch) {
    const row = (await updateContact({
      data: {
        id,
        first_name: patch.firstName,
        last_name: patch.lastName,
        phone: patch.phone,
        email: patch.email,
        tags: patch.tags,
      },
    })) as Row;
    return mapRow(row);
  },
  async remove(id) {
    await deleteContact({ data: { id } });
  },
  async bulkImport(file) {
    const signed = (await getContactImportUploadUrl({
      data: { filename: file.name },
    })) as { path: string; token: string; signedUrl: string };
    const put = await fetch(signed.signedUrl, { method: "PUT", body: file });
    if (!put.ok) throw new Error(`Fallo la subida del CSV [${put.status}]`);
    return (await importContactsCsv({ data: { path: signed.path } })) as {
      imported: number;
      duplicates: number;
      errors: number;
    };
  },
};
