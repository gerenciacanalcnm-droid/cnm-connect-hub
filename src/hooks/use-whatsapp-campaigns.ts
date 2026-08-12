import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  getWhatsAppCampaigns, 
  createWhatsAppCampaign, 
  getWhatsAppCampaignDetails 
} from "@/lib/whatsapp-campaigns.functions";
import { toast } from "sonner";

export function useWhatsAppCampaigns(companyId?: string) {
  const fetchCampaigns = useServerFn(getWhatsAppCampaigns);

  return useQuery({
    queryKey: ["whatsapp-campaigns", companyId],
    queryFn: () => fetchCampaigns({ data: { companyId: companyId! } }),
    enabled: !!companyId,
  });
}

export function useCreateWhatsAppCampaign() {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createWhatsAppCampaign);

  return useMutation({
    mutationFn: (data: Parameters<typeof createFn>[0]["data"]) => createFn({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns", variables.companyId] });
      toast.success("Campaña creada correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear la campaña");
    }
  });
}

export function useWhatsAppCampaignDetails(campaignId?: string) {
  const fetchDetails = useServerFn(getWhatsAppCampaignDetails);

  return useQuery({
    queryKey: ["whatsapp-campaign-details", campaignId],
    queryFn: () => fetchDetails({ data: { campaignId: campaignId! } }),
    enabled: !!campaignId,
  });
}
