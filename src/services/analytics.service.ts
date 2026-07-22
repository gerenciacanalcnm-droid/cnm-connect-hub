export interface AnalyticsSeriesPoint {
  x: string;
  y: number;
}

export interface AnalyticsService {
  getDeliverySeries(): Promise<AnalyticsSeriesPoint[]>;
}

export const analyticsService: AnalyticsService = {
  async getDeliverySeries() {
    return [];
  },
};
