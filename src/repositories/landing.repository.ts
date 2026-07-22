import { landingService } from "@/services/landing.service";
import type { LandingContent } from "@/config/landing-content";

/**
 * Repositorio: contrato estable que consume la UI.
 * Aísla los Services de los componentes.
 */
export interface LandingRepository {
  getContent(): Promise<LandingContent>;
}

export const landingRepository: LandingRepository = {
  getContent: () => landingService.getContent(),
};
