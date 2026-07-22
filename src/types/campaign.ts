import type { ID } from "./common";
import type { CampaignStatus } from "@/constants/status";

export interface Campaign {
  id: ID;
  name: string;
  status: CampaignStatus;
  message: string;
  audienceSize: number;
  scheduledAt?: string;
  createdAt: string;
  companyId: ID;
}
