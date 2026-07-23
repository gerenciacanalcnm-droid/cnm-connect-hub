import type { Contact } from "@/types/contact";
import type { Paginated, QueryParams } from "@/types/common";
import type { Deal, CrmActivity } from "@/types/crm";
import { contactService } from "./contact.service";
import { crmMock } from "./mocks/crm.mock";

const DEALS: Deal[] = crmMock.listDeals();

export interface CrmService {
  listContacts(params?: QueryParams): Promise<Paginated<Contact>>;
  listDeals(): Promise<Deal[]>;
  updateDealStage(id: string, stage: Deal["stage"]): Promise<Deal>;
  activities(dealId: string): Promise<CrmActivity[]>;
}

export const crmService: CrmService = {
  listContacts: (params) => contactService.list(params),
  async listDeals() {
    return DEALS;
  },
  async updateDealStage(did, stage) {
    const i = DEALS.findIndex((d) => d.id === did);
    if (i < 0) throw new Error("Deal not found");
    DEALS[i] = { ...DEALS[i]!, stage, updatedAt: new Date().toISOString() };
    return DEALS[i]!;
  },
  async activities(dealId) {
    return crmMock.listActivities(dealId);
  },
};
