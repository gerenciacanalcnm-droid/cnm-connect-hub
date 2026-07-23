import { smsService, type SmsService } from "@/services/sms.service";

export const smsRepository: SmsService = {
  list: (p) => smsService.list(p),
  send: (i) => smsService.send(i),
  bulkSend: (i) => smsService.bulkSend(i),
};
