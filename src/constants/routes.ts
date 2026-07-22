export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  crm: "/crm",
  comunicacion: "/comunicacion",
  analytics: "/analytics",
  automatizaciones: "/automatizaciones",
  api: "/api",
  finanzas: "/finanzas",
  soporte: "/soporte",
  configuracion: "/configuracion",
  miEmpresa: "/mi-empresa",
} as const;

export type RouteKey = keyof typeof ROUTES;
