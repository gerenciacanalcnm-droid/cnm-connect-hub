import { settingsService } from "@/services/settings.service";
import type { SettingsConfig } from "@/config/settings.config";

export interface SettingsRepository {
  get(): Promise<SettingsConfig>;
  update(patch: Partial<SettingsConfig>): Promise<SettingsConfig>;
}

export const settingsRepository: SettingsRepository = {
  get: () => settingsService.get(),
  update: (patch) => settingsService.update(patch),
};
