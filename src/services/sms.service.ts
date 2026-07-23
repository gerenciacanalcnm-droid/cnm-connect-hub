import type { Sms } from "@/types/sms";
import type { Paginated, QueryParams } from "@/types/common";
import { smsMock } from "./mocks/sms.mock";
import { paginate, id } from "./mocks/seed";

const DATA: Sms[] = smsMock.list();

export interface SmsService {
  list(params?: QueryParams): Promise<Paginated<Sms>>;
  send(input: { to: string; message: string; from?: string }): Promise<Sms>;
  bulkSend(input: { recipients: string[]; message: string; from?: string; scheduleAt?: string }): Promise<{ jobId: string; count: number }>;
}

function applyQuery(items: Sms[], q?: QueryParams): Sms[] {
  if (!q) return items;
  let out = items;
  if (q.search) {
    const s = q.search.toLowerCase();
    out = out.filter((r) => r.to.toLowerCase().includes(s) || r.message.toLowerCase().includes(s));
  }
  if (q.sortBy) {
    const dir = q.sortDir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => (a[q.sortBy as keyof Sms]! > b[q.sortBy as keyof Sms]! ? dir : -dir));
  }
  return out;
}

export const smsService: SmsService = {
  async list(params) {
    const filtered = applyQuery(DATA, params);
    return paginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
  },
  async send(input) {
    const item: Sms = {
      id: id("sms"),
      to: input.to,
      from: input.from ?? "CNM",
      message: input.message,
      status: "queued",
      createdAt: new Date().toISOString(),
      companyId: "cnm-1",
    };
    DATA.unshift(item);
    return item;
  },
  async bulkSend(input) {
    return { jobId: id("job"), count: input.recipients.length };
  },
};
