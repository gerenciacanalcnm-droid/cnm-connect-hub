import { useQuery } from "@tanstack/react-query";
import { settingsRepository } from "@/repositories/settings.repository";
import { queryKeys } from "./queries/keys";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsRepository.get(),
    staleTime: 1000 * 60 * 5,
  });
}
