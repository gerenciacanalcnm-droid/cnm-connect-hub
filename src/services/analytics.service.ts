import type { AnalyticsBreakdown, AnalyticsSeriesPoint } from "@/types/analytics";

export type { AnalyticsBreakdown, AnalyticsSeriesPoint };

export interface AnalyticsService {
  getDeliverySeries(): Promise<AnalyticsSeriesPoint[]>;
  getBreakdown(): Promise<AnalyticsBreakdown>;
}

export const analyticsService: AnalyticsService = {
  async getDeliverySeries() {
    return [];
  },
  async getBreakdown() {
    return { delivery: [], failures: [], cost: [], byOperator: [], byCountry: [] };
  },
};
