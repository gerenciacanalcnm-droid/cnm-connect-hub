import { crmService, type CrmService } from "@/services/crm.service";
export const crmRepository: CrmService = {
  listContacts: (p) => crmService.listContacts(p),
  listDeals: () => crmService.listDeals(),
  updateDealStage: (id, s) => crmService.updateDealStage(id, s),
  activities: (id) => crmService.activities(id),
};
