import type { DashboardSummary } from "@/types/dashboard";
import { dashboardMock } from "./mocks/dashboard.mock";
import { getDashboardSummary } from "@/lib/platform.functions";

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
}

export const dashboardService: DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const remote = (await getDashboardSummary()) as {
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
      const base = dashboardMock.summary();
      return {
        ...base,
        balance: { ...base.balance, value: remote.balance, currency: remote.currency },
        smsSent: { ...base.smsSent, value: remote.smsSent },
        deliveryRate: { ...base.deliveryRate, value: remote.deliveryRate },
        activeCampaigns: { ...base.activeCampaigns, value: remote.campaignsCount },
        contacts: { ...base.contacts, value: remote.contactsCount },
        spent: { ...base.spent, value: remote.spent },
      };
    } catch (err) {
      console.error("[dashboardService] fallback a mock:", err);
      return dashboardMock.summary();
    }
  },
};
