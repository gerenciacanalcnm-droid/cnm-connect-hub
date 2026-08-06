import type { Recharge, RechargePackage } from "@/types/recharge";

const NOT_CONNECTED = new Error("Próximamente: las recargas se conectarán en la siguiente fase.");

export interface RechargeService {
  list(): Promise<Recharge[]>;
  balance(): Promise<{ amount: number; currency: string; smsCredits: number }>;
  packages(): Promise<RechargePackage[]>;
  purchase(packageId: string, method: Recharge["method"]): Promise<Recharge>;
}

export const rechargeService: RechargeService = {
  async list() {
    return [];
  },
  async balance() {
    return { amount: 0, currency: "USD", smsCredits: 0 };
  },
  async packages() {
    return [];
  },
  async purchase() {
    throw NOT_CONNECTED;
  },
};
