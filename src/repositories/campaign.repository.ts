import { campaignService } from "@/services/campaign.service";
import type { Campaign } from "@/types/campaign";
import type { Paginated, QueryParams } from "@/types/common";

export interface CampaignRepository {
  list(params?: QueryParams): Promise<Paginated<Campaign>>;
}

export const campaignRepository: CampaignRepository = {
  list: (params) => campaignService.list(params),
};
