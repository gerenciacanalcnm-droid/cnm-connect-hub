import { useQuery } from "@tanstack/react-query";
import { analyticsRepository } from "@/repositories/analytics.repository";
import { queryKeys } from "./queries/keys";

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => analyticsRepository.getDeliverySeries(),
  });
}
