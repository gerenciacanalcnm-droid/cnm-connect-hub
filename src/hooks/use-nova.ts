import { useQuery } from "@tanstack/react-query";
import { novaService } from "@/services/nova.service";
import { queryKeys } from "./queries/keys";

export function useNova() {
  return useQuery({
    queryKey: queryKeys.nova,
    queryFn: () => novaService.suggestions(),
    staleTime: 1000 * 60,
  });
}
