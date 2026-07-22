import type { DashboardSummary } from "@/types/dashboard";

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
}

export const dashboardService: DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return { kpis: [], updatedAt: new Date().toISOString() };
  },
};
