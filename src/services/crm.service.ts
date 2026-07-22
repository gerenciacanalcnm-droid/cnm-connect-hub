import type { Contact } from "@/types/contact";
import type { Paginated, QueryParams } from "@/types/common";

export interface CrmService {
  listContacts(params?: QueryParams): Promise<Paginated<Contact>>;
}

export const crmService: CrmService = {
  async listContacts() {
    return {
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
  },
};
