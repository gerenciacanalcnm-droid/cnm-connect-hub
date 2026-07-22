import type { ID } from "./common";
import type { SmsStatus } from "@/constants/status";

export interface Sms {
  id: ID;
  to: string;
  from: string;
  message: string;
  status: SmsStatus;
  createdAt: string;
  deliveredAt?: string;
  companyId: ID;
}
