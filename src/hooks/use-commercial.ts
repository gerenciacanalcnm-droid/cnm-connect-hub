import { useQuery } from "@tanstack/react-query";
import { commercialRepository } from "@/repositories/commercial.repository";

const key = (...parts: string[]) => ["commercial", ...parts] as const;
const STALE = 1000 * 60 * 2;

export function useCommercialFeatures() {
  return useQuery({
    queryKey: key("features"),
    queryFn: () => commercialRepository.listFeatures(),
    staleTime: STALE,
  });
}

export function useCommercialPlans() {
  return useQuery({
    queryKey: key("plans"),
    queryFn: () => commercialRepository.listPlans(),
    staleTime: STALE,
  });
}

export function useRateTiers() {
  return useQuery({
    queryKey: key("rate-tiers"),
    queryFn: () => commercialRepository.listRateTiers(),
    staleTime: STALE,
  });
}

export function useCommercialPromotions() {
  return useQuery({
    queryKey: key("promotions"),
    queryFn: () => commercialRepository.listPromotions(),
    staleTime: STALE,
  });
}

export function usePaymentGateways() {
  return useQuery({
    queryKey: key("gateways"),
    queryFn: () => commercialRepository.listGateways(),
    staleTime: STALE,
  });
}

export function useWallets() {
  return useQuery({
    queryKey: key("wallets"),
    queryFn: () => commercialRepository.listWallets(),
    staleTime: STALE,
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: key("wallet-transactions"),
    queryFn: () => commercialRepository.listWalletTransactions(),
    staleTime: STALE,
  });
}

export function useRechargeRequests() {
  return useQuery({
    queryKey: key("recharges"),
    queryFn: () => commercialRepository.listRecharges(),
    staleTime: STALE,
  });
}

export function useCommercialHistory() {
  return useQuery({
    queryKey: key("history"),
    queryFn: () => commercialRepository.listHistory(),
    staleTime: STALE,
  });
}

export const commercialKeys = key;
