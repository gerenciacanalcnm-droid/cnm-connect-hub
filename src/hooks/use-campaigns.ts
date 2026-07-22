import { useQuery } from "@tanstack/react-query";
import { campaignRepository } from "@/repositories/campaign.repository";
import type { QueryParams } from "@/types/common";
import { queryKeys } from "./queries/keys";

export function useCampaigns(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.campaigns(params),
    queryFn: () => campaignRepository.list(params),
  });
}
