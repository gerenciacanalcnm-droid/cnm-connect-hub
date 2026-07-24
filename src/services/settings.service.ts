import { settingsConfig, type SettingsConfig, type FeatureKey } from "@/config/settings.config";
import { listFeatureFlags } from "@/lib/platform.functions";

export interface SettingsService {
  get(): Promise<SettingsConfig>;
  update(patch: Partial<SettingsConfig>): Promise<SettingsConfig>;
}

export const settingsService: SettingsService = {
  async get() {
    try {
      const flags = (await listFeatureFlags()) as { key: string; enabled_globally: boolean }[];
      if (!flags.length) return settingsConfig;
      const remote = { ...settingsConfig.features } as Record<string, boolean>;
      for (const f of flags) if (f.key in remote) remote[f.key] = f.enabled_globally;
      return {
        ...settingsConfig,
        features: remote as SettingsConfig["features"],
      };
    } catch (err) {
      console.error("[settingsService] fallback a mock:", err);
      return settingsConfig;
    }
  },
  async update() {
    throw new Error("settingsService.update requiere auth + rol super_admin (próximo sprint).");
  },
};

export type { SettingsConfig, FeatureKey };
