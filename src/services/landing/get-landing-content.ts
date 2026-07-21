/**
 * SMS CNM — Landing content service
 *
 * En producción este servicio consumirá el endpoint del Panel del Super
 * Administrador (por ejemplo `GET /api/public/landing-content`). Mientras
 * tanto devuelve el fallback estático para que el frontend quede totalmente
 * preparado sin acoplarse a datos hardcodeados en componentes.
 */
import { fallbackLandingContent, type LandingContent } from "@/config/landing-content";

export async function getLandingContent(): Promise<LandingContent> {
  // TODO: reemplazar por `api.get<LandingContent>("/landing-content")`
  // cuando el Panel del Super Administrador exponga el endpoint.
  return fallbackLandingContent;
}
