import type { Contact } from "@/types/contact";
import type { Paginated, QueryParams } from "@/types/common";
import type { Deal, CrmActivity } from "@/types/crm";
import { contactService } from "./contact.service";

export interface CrmService {
  listContacts(params?: QueryParams): Promise<Paginated<Contact>>;
  listDeals(): Promise<Deal[]>;
  updateDealStage(id: string, stage: Deal["stage"]): Promise<Deal>;
  activities(dealId: string): Promise<CrmActivity[]>;
}

const NOT_CONNECTED = new Error("Módulo aún no conectado a la base de datos.");

export const crmService: CrmService = {
  listContacts: (params) => contactService.list(params),
  async listDeals() {
    return [];
  },
  async updateDealStage() {
    throw NOT_CONNECTED;
  },
  async activities() {
    return [];
  },
};
