import { useQuery } from "@tanstack/react-query";
import { contactRepository } from "@/repositories/contact.repository";
import type { QueryParams } from "@/types/common";
import { queryKeys } from "./queries/keys";

export function useContacts(params?: QueryParams & { tag?: string }) {
  return useQuery({
    queryKey: queryKeys.contacts(params),
    queryFn: () => contactRepository.list(params),
  });
}
