import type { DashboardSummary } from "@/types/dashboard";
import { dashboardMock } from "./mocks/dashboard.mock";

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
}

export const dashboardService: DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return dashboardMock.summary();
  },
};
