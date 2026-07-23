import { int, resetSeed } from "./seed";
import type { AnalyticsSeriesPoint } from "@/services/analytics.service";

export function buildDeliverySeries(days = 30): AnalyticsSeriesPoint[] {
  resetSeed(0xA11);
  const out: AnalyticsSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    out.push({
      x: d.toISOString().slice(0, 10),
      y: int(2_500, 12_000),
    });
  }
  return out;
}

export interface AnalyticsBreakdown {
  delivery: AnalyticsSeriesPoint[];
  failures: AnalyticsSeriesPoint[];
  cost: AnalyticsSeriesPoint[];
  byOperator: { name: string; value: number }[];
  byCountry: { country: string; value: number }[];
}

export function buildAnalyticsMock(): AnalyticsBreakdown {
  resetSeed(0xB12);
  return {
    delivery: buildDeliverySeries(30),
    failures: Array.from({ length: 30 }).map((_, i) => ({
      x: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
      y: int(20, 320),
    })),
    cost: Array.from({ length: 30 }).map((_, i) => ({
      x: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
      y: int(400, 3200),
    })),
    byOperator: [
      { name: "Telcel", value: 42 },
      { name: "AT&T", value: 24 },
      { name: "Movistar", value: 18 },
      { name: "Claro", value: 11 },
      { name: "Otros", value: 5 },
    ],
    byCountry: [
      { country: "México", value: 58 },
      { country: "Colombia", value: 22 },
      { country: "España", value: 12 },
      { country: "Perú", value: 5 },
      { country: "Chile", value: 3 },
    ],
  };
}

export const analyticsMock = {
  series: buildDeliverySeries,
  breakdown: buildAnalyticsMock,
};
