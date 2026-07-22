import { smsService } from "@/services/sms.service";
import type { Sms } from "@/types/sms";
import type { Paginated, QueryParams } from "@/types/common";

export interface SmsRepository {
  list(params?: QueryParams): Promise<Paginated<Sms>>;
  send(input: { to: string; message: string; from?: string }): Promise<Sms>;
}

export const smsRepository: SmsRepository = {
  list: (params) => smsService.list(params),
  send: (input) => smsService.send(input),
};
