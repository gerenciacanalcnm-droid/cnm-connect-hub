import { adminSettingsService, type AdminSettings } from "@/services/admin-settings.service";

export interface AdminSettingsRepository {
  get(): Promise<AdminSettings>;
  getSnapshot(): AdminSettings;
  update(patch: Partial<AdminSettings>): Promise<AdminSettings>;
}

export const adminSettingsRepository: AdminSettingsRepository = {
  get: () => adminSettingsService.get(),
  getSnapshot: () => adminSettingsService.getSnapshot(),
  update: (patch) => adminSettingsService.update(patch),
};
