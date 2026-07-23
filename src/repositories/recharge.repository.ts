import { rechargeService, type RechargeService } from "@/services/recharge.service";
export const rechargeRepository: RechargeService = {
  list: () => rechargeService.list(),
  balance: () => rechargeService.balance(),
  packages: () => rechargeService.packages(),
  purchase: (id, m) => rechargeService.purchase(id, m),
};
