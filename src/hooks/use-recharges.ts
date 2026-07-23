import { useQuery } from "@tanstack/react-query";
import { rechargeRepository } from "@/repositories/recharge.repository";
import { queryKeys } from "./queries/keys";

export function useRecharges() {
  return useQuery({ queryKey: queryKeys.recharges, queryFn: () => rechargeRepository.list() });
}
export function useRechargePackages() {
  return useQuery({ queryKey: queryKeys.rechargePackages, queryFn: () => rechargeRepository.packages() });
}
export function useBalance() {
  return useQuery({ queryKey: queryKeys.balance, queryFn: () => rechargeRepository.balance() });
}
