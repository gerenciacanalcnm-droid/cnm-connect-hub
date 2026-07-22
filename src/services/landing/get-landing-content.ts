/**
 * @deprecated Consumir `landingService.getContent()` o el hook `useLanding()`.
 * Se mantiene para retrocompatibilidad con los componentes actuales.
 */
import { landingService } from "@/services/landing.service";
import type { LandingContent } from "@/config/landing-content";

export function getLandingContent(): Promise<LandingContent> {
  return landingService.getContent();
}
