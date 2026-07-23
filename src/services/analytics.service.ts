import { analyticsMock, type AnalyticsBreakdown } from "./mocks/analytics.mock";

export interface AnalyticsSeriesPoint {
  x: string;
  y: number;
}

export interface AnalyticsService {
  getDeliverySeries(): Promise<AnalyticsSeriesPoint[]>;
  getBreakdown(): Promise<AnalyticsBreakdown>;
}

export const analyticsService: AnalyticsService = {
  async getDeliverySeries() {
    return analyticsMock.series();
  },
  async getBreakdown() {
    return analyticsMock.breakdown();
  },
};
