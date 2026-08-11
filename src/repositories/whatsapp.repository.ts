import { whatsappService, type WhatsAppService } from "@/services/whatsapp.service";
import { testWhatsAppConnection, saveWhatsAppCredentials, sendWhatsAppIndividual } from "@/lib/whatsapp.functions";

export const whatsappRepository = {
  listAccounts: () => whatsappService.listAccounts(),
  saveAccount: (i: any) => whatsappService.saveAccount(i),
  removeAccount: (id: string) => whatsappService.removeAccount(id),
  makePrimary: (id: string) => whatsappService.makePrimary(id),
  listTemplates: () => whatsappService.listTemplates(),
  saveTemplate: (i: any) => whatsappService.saveTemplate(i),
  removeTemplate: (id: string) => whatsappService.removeTemplate(id),
  listCampaigns: () => whatsappService.listCampaigns(),
  createCampaign: (i: any) => whatsappService.createCampaign(i),
  testConnection: testWhatsAppConnection,
  connectMeta: saveWhatsAppCredentials,
  sendIndividual: sendWhatsAppIndividual,
};
