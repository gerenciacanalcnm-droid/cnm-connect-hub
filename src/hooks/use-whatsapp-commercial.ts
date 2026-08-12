import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getCompanyWhatsAppProfile, 
  updateWhatsAppLimits, 
  getWhatsAppConsumptionStats 
} from "@/lib/whatsapp-commercial.functions";

const key = (...parts: string[]) => ["whatsapp-commercial", ...parts] as const;

export function useCompanyWhatsAppProfile(companyId: string) {
  return useQuery({
    queryKey: key("profile", companyId),
    queryFn: () => getCompanyWhatsAppProfile({ data: { companyId } }),
    enabled: !!companyId,
  });
}

export function useWhatsAppConsumptionStats(companyId: string, period: 'today' | 'week' | 'month' | 'historical' = 'month') {
  return useQuery({
    queryKey: key("consumption", companyId, period),
    queryFn: () => getWhatsAppConsumptionStats({ data: { companyId, period } }),
    enabled: !!companyId,
  });
}

export function useWhatsAppLimitMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateWhatsAppLimits>[0]['data']) => 
      updateWhatsAppLimits({ data }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: key("profile", variables.companyId) });
    },
  });
}
