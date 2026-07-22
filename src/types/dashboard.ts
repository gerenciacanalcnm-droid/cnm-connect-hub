export interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  delta?: number;
  trend?: number[];
}

export interface DashboardSummary {
  kpis: DashboardKpi[];
  updatedAt: string;
}
