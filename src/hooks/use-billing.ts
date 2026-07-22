import { useQuery } from "@tanstack/react-query";
import { billingService } from "@/services/billing.service";
import { queryKeys } from "./queries/keys";

export function useBilling() {
  const plans = useQuery({
    queryKey: queryKeys.billing.plans,
    queryFn: () => billingService.listPlans(),
    staleTime: 1000 * 60 * 5,
  });
  const pricing = useQuery({
    queryKey: queryKeys.billing.pricing,
    queryFn: () => billingService.getPricing(),
    staleTime: 1000 * 60 * 5,
  });
  const promotions = useQuery({
    queryKey: queryKeys.billing.promotions,
    queryFn: () => billingService.listPromotions(),
    staleTime: 1000 * 60 * 5,
  });
  return { plans, pricing, promotions };
}
