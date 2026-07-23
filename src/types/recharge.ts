import type { ID } from "./common";

export interface Recharge {
  id: ID;
  amount: number;
  currency: string;
  smsCredits: number;
  status: "completed" | "pending" | "failed";
  method: "card" | "transfer" | "paypal";
  reference: string;
  createdAt: string;
}

export interface RechargePackage {
  id: ID;
  name: string;
  smsCredits: number;
  price: number;
  currency: string;
  bonus?: number;
  popular?: boolean;
}
