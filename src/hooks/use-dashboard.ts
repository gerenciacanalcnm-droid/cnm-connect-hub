import { useQuery } from "@tanstack/react-query";
import { dashboardRepository } from "@/repositories/dashboard.repository";
import { queryKeys } from "./queries/keys";

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => dashboardRepository.getSummary(),
    staleTime: 1000 * 60,
  });
}
