import type { Contact } from "@/types/contact";
import type { Paginated, QueryParams } from "@/types/common";
import { listContacts } from "@/lib/platform.functions";

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
  bulkImport(rows: ContactInput[]): Promise<{ imported: number; duplicates: number }>;
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
  };
}

const notImpl = () => {
  throw new Error("Escritura de contactos requiere auth (próximo sprint).");
};

export const contactService: ContactService = {
  async list(params) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    try {
      const res = (await listContacts({
        data: { page, pageSize, search: params?.search, tag: params?.tag },
      })) as { rows: Row[]; total: number };
      const items = res.rows.map(mapRow);
      return {
        items,
        total: res.total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(res.total / pageSize)),
      };
    } catch (err) {
      console.error("[contactService] list error:", err);
      return { items: [], total: 0, page, pageSize, totalPages: 1 };
    }
  },
  async getById(id) {
    const all = await this.list({ pageSize: 200 });
    return all.items.find((c) => c.id === id);
  },
  async create() {
    return notImpl();
  },
  async update() {
    return notImpl();
  },
  async remove() {
    return notImpl();
  },
  async bulkImport() {
    return notImpl();
  },
};
