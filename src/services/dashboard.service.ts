import type { DashboardSummary, DashboardKpi } from "@/types/dashboard";
import { dashboardMock } from "./mocks/dashboard.mock";
import { getDashboardSummary } from "@/lib/platform.functions";

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
}

type RemoteSummary = {
  balance: number;
  currency: string;
  contactsCount: number;
  campaignsCount: number;
  smsSent: number;
  smsDelivered: number;
  smsFailed: number;
  deliveryRate: number;
  spent: number;
};

export const dashboardService: DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const base = dashboardMock.summary();
    try {
      const remote = (await getDashboardSummary()) as RemoteSummary;
      const overrides: Record<string, number> = {
        balance: remote.balance,
        "sent-today": remote.smsSent,
        delivered: remote.smsDelivered,
        failed: remote.smsFailed,
        "active-campaigns": remote.campaignsCount,
        monthly: remote.spent,
      };
      const kpis: DashboardKpi[] = base.kpis.map((k) =>
        k.id in overrides ? { ...k, value: overrides[k.id]! } : k,
      );
      return { kpis, updatedAt: new Date().toISOString() };
    } catch (err) {
      console.error("[dashboardService] fallback a mock:", err);
      return base;
    }
  },
};
