import type { DashboardSummary, DashboardKpi } from "@/types/dashboard";
import { int, resetSeed } from "./seed";

function trend(n = 12): number[] {
  return Array.from({ length: n }).map(() => int(30, 100));
}

export function buildDashboardMock(): DashboardSummary {
  resetSeed(0xDA5H);
  const kpis: DashboardKpi[] = [
    { id: "balance", label: "Saldo disponible", value: 48_720, prefix: "$", delta: 8.4, trend: trend() },
    { id: "credits", label: "SMS disponibles", value: 194_880, delta: 3.1, trend: trend() },
    { id: "sent-today", label: "SMS enviados hoy", value: 12_480, delta: 12.6, trend: trend() },
    { id: "delivered", label: "SMS entregados", value: 11_902, suffix: " (95.4%)", delta: 1.8, trend: trend() },
    { id: "failed", label: "SMS fallidos", value: 214, delta: -2.4, trend: trend() },
    { id: "active-campaigns", label: "Campañas activas", value: 8, delta: 0, trend: trend() },
    { id: "scheduled", label: "Campañas programadas", value: 12, delta: 4.2, trend: trend() },
    { id: "monthly", label: "Consumo mensual", value: 148_320, delta: 6.7, trend: trend() },
    { id: "recharges", label: "Recargas del mes", value: 6, prefix: "", delta: 20, trend: trend() },
  ];
  return { kpis, updatedAt: new Date().toISOString() };
}

export const dashboardMock = { summary: buildDashboardMock };
