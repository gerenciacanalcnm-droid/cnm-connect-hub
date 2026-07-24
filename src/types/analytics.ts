export interface AnalyticsSeriesPoint {
  x: string;
  y: number;
}

export interface AnalyticsBreakdown {
  delivery: AnalyticsSeriesPoint[];
  failures: AnalyticsSeriesPoint[];
  cost: AnalyticsSeriesPoint[];
  byOperator: { name: string; value: number }[];
  byCountry: { country: string; value: number }[];
}
