import { useQuery } from "@tanstack/react-query";
import { adminSettingsRepository } from "@/repositories/admin-settings.repository";
import type { AdminSettings } from "@/services/admin-settings.service";

const adminSettingsKey = ["admin", "settings"] as const;

/**
 * useAdminSettings — Hook único que expone la configuración administrativa.
 * Usa el snapshot del Mock Provider como `initialData` para que los
 * componentes puedan renderizar sincrónicamente sin ver estados de carga.
 * Al conectar backend, `AdminSettingsService.get()` cambia y el hook
 * seguirá funcionando sin modificar componentes.
 */
export function useAdminSettings() {
  const initial = adminSettingsRepository.getSnapshot();
  return useQuery<AdminSettings>({
    queryKey: adminSettingsKey,
    queryFn: () => adminSettingsRepository.get(),
    initialData: initial,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminGeneral() {
  return useAdminSettings().data.general;
}
export function useAdminSms() {
  return useAdminSettings().data.sms;
}
export function useAdminWhatsapp() {
  return useAdminSettings().data.whatsapp;
}
export function useAdminNova() {
  return useAdminSettings().data.nova;
}
export function useAdminApi() {
  return useAdminSettings().data.api;
}
export function useAdminSecurity() {
  return useAdminSettings().data.security;
}
export function useAdminNotifications() {
  return useAdminSettings().data.notifications;
}
export function useAdminTariffs() {
  return useAdminSettings().data.tariffs;
}
export function useAdminPlans() {
  return useAdminSettings().data.plans;
}
export function useAdminPromotions() {
  return useAdminSettings().data.promotions;
}
export function useAdminPaymentMethods() {
  return useAdminSettings().data.paymentMethods;
}
export function useAdminIntegrations() {
  return useAdminSettings().data.integrations;
}
