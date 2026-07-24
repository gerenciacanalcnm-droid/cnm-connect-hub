/**
 * LandingService — resuelve el contenido de la landing.
 * Intenta leer desde `settings/landing/content` (Landing CMS del Super Admin).
 * Si no hay contenido o falla la consulta, cae al mock por defecto para que
 * el sitio nunca quede en blanco.
 */
import { fallbackLandingContent, type LandingContent } from "@/config/landing-content";
import { LandingMapper } from "@/mappers/landing.mapper";
import { getLandingContent as getLandingContentFn } from "@/lib/platform.functions";

export interface LandingService {
  getContent(): Promise<LandingContent>;
}

function isBootstrap(value: unknown): boolean {
  return (
    !value ||
    (typeof value === "object" &&
      value !== null &&
      "_bootstrap" in (value as Record<string, unknown>))
  );
}

export const landingService: LandingService = {
  async getContent(): Promise<LandingContent> {
    try {
      const remote = await getLandingContentFn();
      if (isBootstrap(remote)) return LandingMapper.fromDTO(fallbackLandingContent);
      return LandingMapper.fromDTO(remote as LandingContent);
    } catch (err) {
      console.error("[landingService] fallback a mock:", err);
      return LandingMapper.fromDTO(fallbackLandingContent);
    }
  },
};
