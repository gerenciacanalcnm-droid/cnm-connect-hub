/**
 * Feature Flags — sistema global para activar/desactivar módulos.
 * Fuente: `settingsConfig.features` (mock) o el backend cuando exista.
 */
import { settingsConfig, type FeatureKey } from "@/config/settings.config";

export type { FeatureKey };

let overrides: Partial<Record<FeatureKey, boolean>> = {};

export function setFeatureFlag(key: FeatureKey, enabled: boolean): void {
  overrides = { ...overrides, [key]: enabled };
}

export function isFeatureEnabled(key: FeatureKey): boolean {
  if (key in overrides) return Boolean(overrides[key]);
  return Boolean((settingsConfig.features as Record<string, boolean>)[key]);
}

export function getAllFlags(): Record<FeatureKey, boolean> {
  const out = { ...settingsConfig.features } as Record<FeatureKey, boolean>;
  for (const [k, v] of Object.entries(overrides)) {
    out[k as FeatureKey] = Boolean(v);
  }
  return out;
}
