import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getWhatsAppCampaigns, 
  createWhatsAppCampaign, 
  getWhatsAppCampaignDetails,
  startWhatsAppCampaign 
} from "@/lib/whatsapp-campaigns.functions";

export function useWhatsAppCampaigns(companyId?: string) {
  return useQuery({
    queryKey: ["whatsapp-campaigns", companyId],
    queryFn: () => getWhatsAppCampaigns({ data: { companyId: companyId! } }),
    enabled: !!companyId
  });
}

export function useWhatsAppCampaignDetails(campaignId?: string) {
  return useQuery({
    queryKey: ["whatsapp-campaign-details", campaignId],
    queryFn: () => getWhatsAppCampaignDetails({ data: { campaignId: campaignId! } }),
    enabled: !!campaignId
  });
}

export function useCreateWhatsAppCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createWhatsAppCampaign({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
    }
  });
}

export function useStartWhatsAppCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => startWhatsAppCampaign({ data: { campaignId } }),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaign-details", campaignId] });
    }
  });
}
