import { commercialService, type CommercialService } from "@/services/commercial.service";

export const commercialRepository: CommercialService = {
  listFeatures: () => commercialService.listFeatures(),
  listPlans: () => commercialService.listPlans(),
  listRateTiers: () => commercialService.listRateTiers(),
  listPromotions: () => commercialService.listPromotions(),
  listGateways: () => commercialService.listGateways(),
  listWallets: () => commercialService.listWallets(),
  listWalletTransactions: (walletId?: string) =>
    commercialService.listWalletTransactions(walletId),
  listRecharges: () => commercialService.listRecharges(),
  listHistory: () => commercialService.listHistory(),
};

import { commercialWriteService, type CommercialWriteService } from "@/services/commercial.service";

export const commercialWriteRepository: CommercialWriteService = commercialWriteService;
