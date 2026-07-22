import { useQuery } from "@tanstack/react-query";
import { companyRepository } from "@/repositories/company.repository";
import { queryKeys } from "./queries/keys";

export function useCompany() {
  return useQuery({
    queryKey: queryKeys.company,
    queryFn: () => companyRepository.getCurrent(),
    staleTime: 1000 * 60 * 5,
  });
}
