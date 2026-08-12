import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWebhookDiagnostic } from "@/lib/whatsapp-webhooks.functions";

export function useWebhookDiagnostic(companyId?: string) {
  const getDiagnostic = useServerFn(getWebhookDiagnostic);
  return useQuery({
    queryKey: ["whatsapp-webhook-diagnostic", companyId],
    queryFn: () => getDiagnostic({ data: { companyId: companyId! } }),
    enabled: !!companyId,
    refetchInterval: 5000 // Poll every 5s for real-time feel
  });
}
