/**
 * Internationalization scaffold.
 * Kept intentionally minimal; ready to be wired to i18next / next-intl later.
 */
import { siteConfig } from "@/config/site";

export type Locale = (typeof siteConfig.supportedLocales)[number];

export const defaultLocale: Locale = siteConfig.defaultLocale as Locale;

const dictionaries: Record<Locale, Record<string, string>> = {
  es: {
    "common.search": "Buscar",
    "common.notifications": "Notificaciones",
    "common.profile": "Perfil",
    "common.settings": "Configuración",
    "common.logout": "Cerrar sesión",
    "nav.dashboard": "Dashboard",
  },
  en: {
    "common.search": "Search",
    "common.notifications": "Notifications",
    "common.profile": "Profile",
    "common.settings": "Settings",
    "common.logout": "Log out",
    "nav.dashboard": "Dashboard",
  },
};

export function t(key: string, locale: Locale = defaultLocale): string {
  return dictionaries[locale]?.[key] ?? key;
}
