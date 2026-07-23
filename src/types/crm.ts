import type { ID } from "./common";

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface Deal {
  id: ID;
  title: string;
  contactName: string;
  companyName?: string;
  amount: number;
  currency: string;
  stage: DealStage;
  probability: number;
  ownerName: string;
  nextActionAt?: string;
  updatedAt: string;
  createdAt: string;
  tags: string[];
}

export interface CrmActivity {
  id: ID;
  dealId: ID;
  type: "note" | "call" | "email" | "sms" | "meeting" | "task";
  title: string;
  body?: string;
  createdAt: string;
  authorName: string;
  done?: boolean;
}
