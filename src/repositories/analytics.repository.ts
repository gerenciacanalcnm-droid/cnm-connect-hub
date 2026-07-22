import { analyticsService, type AnalyticsSeriesPoint } from "@/services/analytics.service";

export interface AnalyticsRepository {
  getDeliverySeries(): Promise<AnalyticsSeriesPoint[]>;
}

export const analyticsRepository: AnalyticsRepository = {
  getDeliverySeries: () => analyticsService.getDeliverySeries(),
};
