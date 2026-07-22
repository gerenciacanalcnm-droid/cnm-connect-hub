/**
 * LandingService — fuente única para el contenido de la Landing.
 * Hoy lee del mock provider (`@/config/landing-content`).
 * Mañana consumirá `apiClient.get("/landing-content")` sin tocar componentes.
 */
import { fallbackLandingContent, type LandingContent } from "@/config/landing-content";
import { LandingMapper } from "@/mappers/landing.mapper";
// import { apiClient } from "@/lib/api/client";

export interface LandingService {
  getContent(): Promise<LandingContent>;
}

export const landingService: LandingService = {
  async getContent(): Promise<LandingContent> {
    // TODO backend: const dto = await apiClient.get<unknown>("/landing-content");
    // return LandingMapper.fromDTO(landingSchema.parse(dto));
    return LandingMapper.fromDTO(fallbackLandingContent);
  },
};
