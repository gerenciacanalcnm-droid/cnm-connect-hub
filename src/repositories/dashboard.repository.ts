import { dashboardService } from "@/services/dashboard.service";
import type { DashboardSummary } from "@/types/dashboard";

export interface DashboardRepository {
  getSummary(): Promise<DashboardSummary>;
}

export const dashboardRepository: DashboardRepository = {
  getSummary: () => dashboardService.getSummary(),
};
