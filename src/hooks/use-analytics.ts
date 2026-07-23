import { useQuery } from "@tanstack/react-query";
import { analyticsRepository } from "@/repositories/analytics.repository";
import { analyticsService } from "@/services/analytics.service";
import { queryKeys } from "./queries/keys";

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => analyticsRepository.getDeliverySeries(),
  });
}

export function useAnalyticsBreakdown() {
  return useQuery({
    queryKey: queryKeys.analyticsBreakdown,
    queryFn: () => analyticsService.getBreakdown(),
  });
}
