import { campaignService, type CampaignService } from "@/services/campaign.service";

export const campaignRepository: CampaignService = {
  list: (p) => campaignService.list(p),
  getById: (id) => campaignService.getById(id),
  create: (i) => campaignService.create(i),
  update: (id, p) => campaignService.update(id, p),
  remove: (id) => campaignService.remove(id),
  duplicate: (id) => campaignService.duplicate(id),
  setStatus: (id, s) => campaignService.setStatus(id, s),
};
