import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappRepository } from "@/repositories/whatsapp.repository";
import { queryKeys } from "./queries/keys";

export function useWhatsAppAccounts() {
  return useQuery({
    queryKey: queryKeys.whatsapp.accounts,
    queryFn: () => whatsappRepository.listAccounts(),
  });
}

export function useSaveWhatsAppAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: whatsappRepository.saveAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsapp.accounts }),
  });
}

export function useDeleteWhatsAppAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: whatsappRepository.removeAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsapp.accounts }),
  });
}

export function useSetPrimaryWhatsAppAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: whatsappRepository.makePrimary,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsapp.accounts }),
  });
}

export function useConnectWhatsAppMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => 
      whatsappRepository.connectMeta({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsapp.accounts }),
  });
}

export function useTestWhatsAppConnection() {
  return useMutation({
    mutationFn: (data: any) => 
      whatsappRepository.testConnection({ data }),
  });
}

export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: queryKeys.whatsapp.templates,
    queryFn: () => whatsappRepository.listTemplates(),
  });
}

export function useSaveWhatsAppTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: whatsappRepository.saveTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsapp.templates }),
  });
}

export function useDeleteWhatsAppTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: whatsappRepository.removeTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsapp.templates }),
  });
}

export function useWhatsAppCampaigns() {
  return useQuery({
    queryKey: queryKeys.whatsapp.campaigns,
    queryFn: () => whatsappRepository.listCampaigns(),
  });
}

export function useSendWhatsAppIndividual() {
  return useMutation({
    mutationFn: (data: { recipient: string; body: string; accountId: string }) => 
      whatsappRepository.sendIndividual({ data }),
  });
}

export function useSendWhatsAppBulk() {
  return useMutation({
    mutationFn: (data: { recipients: string[]; body: string; accountId: string }) => 
      whatsappRepository.sendBulk({ data }),
  });
}

export function useSyncWhatsAppTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => 
      whatsappRepository.syncTemplates({ data: { accountId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsapp.templates }),
  });
}

export function useSendWhatsAppTemplate() {
  return useMutation({
    mutationFn: (data: { recipient: string; templateId: string; variables?: Record<string, string>; accountId: string; batchId?: string }) => 
      whatsappRepository.sendTemplate({ data }),
  });
}
