import type { Recharge, RechargePackage } from "@/types/recharge";
import { rechargesMock } from "./mocks/recharges.mock";
import { id } from "./mocks/seed";

const DATA: Recharge[] = rechargesMock.list();

export interface RechargeService {
  list(): Promise<Recharge[]>;
  balance(): Promise<{ amount: number; currency: string; smsCredits: number }>;
  packages(): Promise<RechargePackage[]>;
  purchase(packageId: string, method: Recharge["method"]): Promise<Recharge>;
}

export const rechargeService: RechargeService = {
  async list() {
    return DATA;
  },
  async balance() {
    return { amount: 48_720, currency: "MXN", smsCredits: 194_880 };
  },
  async packages() {
    return rechargesMock.packages();
  },
  async purchase(packageId, method) {
    const pkg = rechargesMock.packages().find((p) => p.id === packageId);
    if (!pkg) throw new Error("Package not found");
    const item: Recharge = {
      id: id("rch"),
      amount: pkg.price,
      currency: pkg.currency,
      smsCredits: pkg.smsCredits + (pkg.bonus ?? 0),
      status: "completed",
      method,
      reference: `REF-${Math.floor(Math.random() * 900_000 + 100_000)}`,
      createdAt: new Date().toISOString(),
    };
    DATA.unshift(item);
    return item;
  },
};
