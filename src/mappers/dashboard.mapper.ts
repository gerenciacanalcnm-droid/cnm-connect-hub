import type { DashboardSummary } from "@/types/dashboard";

export const DashboardMapper = {
  fromDTO(dto: unknown): DashboardSummary {
    return dto as DashboardSummary;
  },
};
