import type { Contact } from "@/types/contact";
import type { Paginated, QueryParams } from "@/types/common";
import { contactsMock } from "./mocks/contacts.mock";
import { paginate, id } from "./mocks/seed";

const DATA: Contact[] = contactsMock.list();

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

function applyQuery(items: Contact[], q?: QueryParams & { tag?: string }): Contact[] {
  let out = items;
  if (q?.search) {
    const s = q.search.toLowerCase();
    out = out.filter(
      (r) => r.firstName.toLowerCase().includes(s) ||
        r.lastName?.toLowerCase().includes(s) ||
        r.phone.includes(s) ||
        r.email?.toLowerCase().includes(s),
    );
  }
  if (q?.tag) out = out.filter((r) => r.tags.includes(q.tag!));
  return out;
}

export const contactService: ContactService = {
  async list(params) {
    const filtered = applyQuery(DATA, params);
    return paginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
  },
  async getById(cid) {
    return DATA.find((c) => c.id === cid);
  },
  async create(input) {
    const item: Contact = {
      id: id("ct"),
      companyId: "cnm-1",
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      tags: input.tags ?? [],
      createdAt: new Date().toISOString(),
    };
    DATA.unshift(item);
    return item;
  },
  async update(cid, patch) {
    const i = DATA.findIndex((c) => c.id === cid);
    if (i < 0) throw new Error("Contact not found");
    DATA[i] = { ...DATA[i]!, ...patch } as Contact;
    return DATA[i]!;
  },
  async remove(cid) {
    const i = DATA.findIndex((c) => c.id === cid);
    if (i >= 0) DATA.splice(i, 1);
  },
  async bulkImport(rows) {
    let imported = 0;
    let duplicates = 0;
    for (const r of rows) {
      if (DATA.some((c) => c.phone === r.phone)) {
        duplicates++;
        continue;
      }
      await this.create(r);
      imported++;
    }
    return { imported, duplicates };
  },
};
