import type { LandingContent } from "@/config/landing-content";

/**
 * LandingMapper: adapta el DTO del backend al modelo de dominio consumido
 * por los componentes. Mientras se use el mock provider, es identidad.
 */
export const LandingMapper = {
  fromDTO(dto: unknown): LandingContent {
    return dto as LandingContent;
  },
  toDTO(model: LandingContent): unknown {
    return model;
  },
};
