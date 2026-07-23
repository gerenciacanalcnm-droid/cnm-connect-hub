import { useQuery } from "@tanstack/react-query";
import { apiKeyRepository } from "@/repositories/api-key.repository";
import { queryKeys } from "./queries/keys";

export function useApiKeys() {
  return useQuery({ queryKey: queryKeys.apiKeys, queryFn: () => apiKeyRepository.listKeys() });
}
export function useWebhooks() {
  return useQuery({ queryKey: queryKeys.webhooks, queryFn: () => apiKeyRepository.listWebhooks() });
}
export function useApiLogs() {
  return useQuery({ queryKey: queryKeys.apiLogs, queryFn: () => apiKeyRepository.logs() });
}
