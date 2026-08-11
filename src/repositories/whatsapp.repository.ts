import { whatsappService, type WhatsAppService } from "@/services/whatsapp.service";
import { testWhatsAppConnection, saveWhatsAppCredentials } from "@/lib/whatsapp.functions";

export const whatsappRepository: WhatsAppService & {
  testConnection: typeof testWhatsAppConnection;
  connectMeta: typeof saveWhatsAppCredentials;
} = {
  listAccounts: () => whatsappService.listAccounts(),
  saveAccount: (i) => whatsappService.saveAccount(i),
  removeAccount: (id) => whatsappService.removeAccount(id),
  makePrimary: (id) => whatsappService.makePrimary(id),
  listTemplates: () => whatsappService.listTemplates(),
  saveTemplate: (i) => whatsappService.saveTemplate(i),
  removeTemplate: (id) => whatsappService.removeTemplate(id),
  listCampaigns: () => whatsappService.listCampaigns(),
  createCampaign: (i) => whatsappService.createCampaign(i),
  testConnection: (data) => testWhatsAppConnection(data),
  connectMeta: (data) => saveWhatsAppCredentials(data),
};
