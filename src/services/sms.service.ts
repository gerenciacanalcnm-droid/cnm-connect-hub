import type { Sms } from "@/types/sms";
import type { Paginated, QueryParams } from "@/types/common";

const NOT_CONNECTED = new Error(
  "Próximamente: el envío de SMS se activará al conectar el proveedor.",
);

export interface SmsService {
  list(params?: QueryParams): Promise<Paginated<Sms>>;
  send(input: { to: string; message: string; from?: string }): Promise<Sms>;
  bulkSend(input: {
    recipients: string[];
    message: string;
    from?: string;
    scheduleAt?: string;
  }): Promise<{ jobId: string; count: number }>;
}

export const smsService: SmsService = {
  async list(params) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    return {
      items: [],
      pagination: { page, pageSize, total: 0, totalPages: 0 },
    };
  },
  async send() {
    throw NOT_CONNECTED;
  },
  async bulkSend() {
    throw NOT_CONNECTED;
  },
};
