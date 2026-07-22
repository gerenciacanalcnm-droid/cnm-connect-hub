import { settingsConfig, type SettingsConfig } from "@/config/settings.config";

export interface SettingsService {
  get(): Promise<SettingsConfig>;
  update(patch: Partial<SettingsConfig>): Promise<SettingsConfig>;
}

export const settingsService: SettingsService = {
  async get() {
    return settingsConfig;
  },
  async update() {
    throw new Error("settingsService.update not implemented");
  },
};
