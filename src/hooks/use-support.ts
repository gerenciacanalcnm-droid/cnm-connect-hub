import { useQuery } from "@tanstack/react-query";
import { supportRepository } from "@/repositories/support.repository";
import { queryKeys } from "./queries/keys";

export function useSupport() {
  return useQuery({
    queryKey: queryKeys.support,
    queryFn: () => supportRepository.listTickets(),
  });
}
