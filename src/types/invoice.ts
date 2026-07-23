import type { ID } from "./common";

export type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

export interface Invoice {
  id: ID;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  concept: string;
}
