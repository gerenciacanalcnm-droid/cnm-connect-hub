import { apiKeyService, type ApiKeyService } from "@/services/api-key.service";
export const apiKeyRepository: ApiKeyService = {
  listKeys: () => apiKeyService.listKeys(),
  createKey: (i) => apiKeyService.createKey(i),
  revokeKey: (id) => apiKeyService.revokeKey(id),
  listWebhooks: () => apiKeyService.listWebhooks(),
  createWebhook: (i) => apiKeyService.createWebhook(i),
  removeWebhook: (id) => apiKeyService.removeWebhook(id),
  logs: () => apiKeyService.logs(),
};
