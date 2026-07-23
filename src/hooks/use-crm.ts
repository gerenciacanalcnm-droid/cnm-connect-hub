import { useQuery } from "@tanstack/react-query";
import { crmRepository } from "@/repositories/crm.repository";
import { queryKeys } from "./queries/keys";

export function useCrmDeals() {
  return useQuery({
    queryKey: queryKeys.crm.deals,
    queryFn: () => crmRepository.listDeals(),
  });
}

export function useCrmActivities(dealId: string) {
  return useQuery({
    queryKey: queryKeys.crm.activities(dealId),
    queryFn: () => crmRepository.activities(dealId),
    enabled: !!dealId,
  });
}
