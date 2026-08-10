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

export function useWalletTransactions(walletId?: string) {
  return useQuery({
    queryKey: key("wallet-transactions", walletId ?? "all"),
    queryFn: () => commercialRepository.listWalletTransactions(walletId),
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commercialWriteRepository as w } from "@/repositories/commercial.repository";

function useInvalidate(parts: string[]) {
  const qc = useQueryClient();
  return () => {
    for (const p of parts) void qc.invalidateQueries({ queryKey: key(p) });
  };
}

export function usePlanMutations() {
  const invalidate = useInvalidate(["plans"]);
  const upsert = useMutation({
    mutationFn: (input: Record<string, unknown>) => w.upsertPlan(input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => w.deletePlan(id),
    onSuccess: invalidate,
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => w.duplicatePlan(id),
    onSuccess: invalidate,
  });
  const setFeature = useMutation({
    mutationFn: (v: { planId: string; featureKey: string; included: boolean }) =>
      w.setPlanFeature(v.planId, v.featureKey, v.included),
    onSuccess: invalidate,
  });
  const setLimit = useMutation({
    mutationFn: (v: {
      planId: string;
      limitKey: string;
      limitValue: number;
      unit: string;
      isUnlimited: boolean;
    }) => w.setPlanLimit(v.planId, v.limitKey, v.limitValue, v.unit, v.isUnlimited),
    onSuccess: invalidate,
  });
  return { upsert, remove, duplicate, setFeature, setLimit };
}

export function useRateTierMutations() {
  const invalidate = useInvalidate(["rate-tiers"]);
  const upsert = useMutation({
    mutationFn: (input: Record<string, unknown>) => w.upsertRateTier(input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => w.deleteRateTier(id),
    onSuccess: invalidate,
  });
  return { upsert, remove };
}

export function usePromotionMutations() {
  const invalidate = useInvalidate(["promotions"]);
  const upsert = useMutation({
    mutationFn: (input: Record<string, unknown>) => w.upsertPromotion(input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => w.deletePromotion(id),
    onSuccess: invalidate,
  });
  return { upsert, remove };
}

export function useGatewayMutations() {
  const invalidate = useInvalidate(["gateways"]);
  const update = useMutation({
    mutationFn: (input: Record<string, unknown>) => w.updateGateway(input),
    onSuccess: invalidate,
  });
  const test = useMutation({
    mutationFn: (id: string) => w.testGateway(id),
    onSuccess: invalidate,
  });
  return { update, test };
}

export function useRechargeMutations() {
  const invalidate = useInvalidate(["recharges", "wallets", "wallet-transactions"]);
  const review = useMutation({
    mutationFn: (v: { id: string; status: string; note: string }) =>
      w.reviewRecharge(v.id, v.status, v.note),
    onSuccess: invalidate,
  });
  return { review };
}

export function useWalletMutations() {
  const invalidate = useInvalidate(["wallets", "wallet-transactions"]);
  const adjust = useMutation({
    mutationFn: (input: Record<string, unknown>) => w.adjustWallet(input),
    onSuccess: invalidate,
  });
  return { adjust };
}
