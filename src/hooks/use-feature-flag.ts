import { settingsConfig, type FeatureKey } from "@/config/settings.config";
import { useSettings } from "./use-settings";

/**
 * useFeatureFlag — devuelve el estado (activo/inactivo) de un módulo.
 * Lee del backend cuando existe, cae al mock estático por defecto.
 */
export function useFeatureFlag(key: FeatureKey): boolean {
  const { data } = useSettings();
  const source = (data?.features ?? settingsConfig.features) as Record<string, boolean>;
  return Boolean(source[key]);
}
