import { useQuery } from "@tanstack/react-query";
import { smsRepository } from "@/repositories/sms.repository";
import type { QueryParams } from "@/types/common";
import { queryKeys } from "./queries/keys";

export function useSms(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.sms(params),
    queryFn: () => smsRepository.list(params),
  });
}
