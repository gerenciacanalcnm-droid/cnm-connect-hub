import type { DashboardSummary, DashboardKpi } from "@/types/dashboard";
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

const KPI_TEMPLATE: DashboardKpi[] = [
  { id: "balance", label: "Saldo disponible", value: 0, prefix: "$" },
  { id: "sent-today", label: "SMS enviados hoy", value: 0 },
  { id: "delivered", label: "SMS entregados", value: 0 },
  { id: "failed", label: "SMS fallidos", value: 0 },
  { id: "active-campaigns", label: "Campañas activas", value: 0 },
  { id: "monthly", label: "Gasto mensual", value: 0, prefix: "$" },
];

export const dashboardService: DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const remote = (await getDashboardSummary()) as RemoteSummary;
    const overrides: Record<string, number> = {
      balance: remote.balance,
      "sent-today": remote.smsSent,
      delivered: remote.smsDelivered,
      failed: remote.smsFailed,
      "active-campaigns": remote.campaignsCount,
      monthly: remote.spent,
    };
    const kpis: DashboardKpi[] = KPI_TEMPLATE.map((k) => ({
      ...k,
      value: overrides[k.id] ?? 0,
    }));
    return { kpis, updatedAt: new Date().toISOString() };
  },
};
