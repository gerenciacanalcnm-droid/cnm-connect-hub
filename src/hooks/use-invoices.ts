import { useQuery } from "@tanstack/react-query";
import { invoiceRepository } from "@/repositories/invoice.repository";
import { queryKeys } from "./queries/keys";

export function useInvoices() {
  return useQuery({ queryKey: queryKeys.invoices, queryFn: () => invoiceRepository.list() });
}
