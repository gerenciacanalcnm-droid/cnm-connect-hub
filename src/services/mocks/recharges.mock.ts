import type { Recharge, RechargePackage } from "@/types/recharge";
import { id, pick, daysAgo, int, resetSeed } from "./seed";

const METHODS: Recharge["method"][] = ["card", "transfer", "paypal"];
const STATUS: Recharge["status"][] = ["completed", "pending", "failed"];

export function buildRechargesMock(count = 40): Recharge[] {
  resetSeed(0xEC0);
  const items: Recharge[] = [];
  for (let i = 0; i < count; i++) {
    const status = i < count - 5 ? "completed" : pick(STATUS);
    const amount = pick([500, 1000, 2500, 5000, 10_000, 25_000]);
    items.push({
      id: id("rch"),
      amount,
      currency: "MXN",
      smsCredits: amount * 4,
      status,
      method: pick(METHODS),
      reference: `REF-${int(100_000, 999_999)}`,
      createdAt: daysAgo(i * 3 + int(0, 2)),
    });
  }
  return items;
}

export const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: "pkg-s", name: "Starter", smsCredits: 2_000, price: 500, currency: "MXN" },
  { id: "pkg-m", name: "Business", smsCredits: 5_000, price: 1_200, currency: "MXN", bonus: 300, popular: true },
  { id: "pkg-l", name: "Growth", smsCredits: 12_000, price: 2_800, currency: "MXN", bonus: 1_200 },
  { id: "pkg-xl", name: "Enterprise", smsCredits: 30_000, price: 6_500, currency: "MXN", bonus: 4_500 },
];

export const rechargesMock = { list: buildRechargesMock, packages: () => RECHARGE_PACKAGES };
