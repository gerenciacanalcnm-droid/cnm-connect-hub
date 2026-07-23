import type { Campaign } from "@/types/campaign";
import type { Paginated, QueryParams } from "@/types/common";
import { campaignsMock } from "./mocks/campaigns.mock";
import { paginate, id } from "./mocks/seed";

const DATA: Campaign[] = campaignsMock.list();

export interface CampaignInput {
  name: string;
  message: string;
  audienceSize?: number;
  scheduledAt?: string;
}

export interface CampaignService {
  list(params?: QueryParams): Promise<Paginated<Campaign>>;
  getById(id: string): Promise<Campaign | undefined>;
  create(input: CampaignInput): Promise<Campaign>;
  update(id: string, patch: Partial<Campaign>): Promise<Campaign>;
  remove(id: string): Promise<void>;
  duplicate(id: string): Promise<Campaign>;
  setStatus(id: string, status: Campaign["status"]): Promise<Campaign>;
}

function applyQuery(items: Campaign[], q?: QueryParams): Campaign[] {
  let out = items;
  if (q?.search) {
    const s = q.search.toLowerCase();
    out = out.filter((r) => r.name.toLowerCase().includes(s));
  }
  return out;
}

export const campaignService: CampaignService = {
  async list(params) {
    const filtered = applyQuery(DATA, params);
    return paginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
  },
  async getById(cid) {
    return DATA.find((c) => c.id === cid);
  },
  async create(input) {
    const item: Campaign = {
      id: id("cmp"),
      name: input.name,
      message: input.message,
      audienceSize: input.audienceSize ?? 0,
      scheduledAt: input.scheduledAt,
      status: input.scheduledAt ? "scheduled" : "draft",
      createdAt: new Date().toISOString(),
      companyId: "cnm-1",
    };
    DATA.unshift(item);
    return item;
  },
  async update(cid, patch) {
    const i = DATA.findIndex((c) => c.id === cid);
    if (i < 0) throw new Error("Campaign not found");
    DATA[i] = { ...DATA[i]!, ...patch } as Campaign;
    return DATA[i]!;
  },
  async remove(cid) {
    const i = DATA.findIndex((c) => c.id === cid);
    if (i >= 0) DATA.splice(i, 1);
  },
  async duplicate(cid) {
    const orig = DATA.find((c) => c.id === cid);
    if (!orig) throw new Error("Campaign not found");
    const copy: Campaign = { ...orig, id: id("cmp"), name: `${orig.name} (copia)`, status: "draft", createdAt: new Date().toISOString() };
    DATA.unshift(copy);
    return copy;
  },
  async setStatus(cid, status) {
    return this.update(cid, { status });
  },
};
