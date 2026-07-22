import type { Campaign } from "@/types/campaign";
import type { Paginated, QueryParams } from "@/types/common";

export interface CampaignService {
  list(params?: QueryParams): Promise<Paginated<Campaign>>;
}

export const campaignService: CampaignService = {
  async list() {
    return { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  },
};
