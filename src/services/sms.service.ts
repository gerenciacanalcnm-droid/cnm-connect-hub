import type { Sms } from "@/types/sms";
import type { Paginated, QueryParams } from "@/types/common";

export interface SmsService {
  list(params?: QueryParams): Promise<Paginated<Sms>>;
  send(input: { to: string; message: string; from?: string }): Promise<Sms>;
}

export const smsService: SmsService = {
  async list() {
    return { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  },
  async send() {
    throw new Error("smsService.send not implemented");
  },
};
