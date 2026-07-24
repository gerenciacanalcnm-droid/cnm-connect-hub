import type { Campaign } from "@/types/campaign";
import type { CampaignStatus } from "@/constants/status";
import type { Paginated, QueryParams } from "@/types/common";
import {
  listCampaigns,
  upsertCampaign,
  duplicateCampaign,
  cancelCampaign,
  deleteCampaign,
} from "@/lib/platform.functions";

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

type Row = {
  id: string;
  company_id: string;
  name: string;
  status: string;
  message_body: string;
  total_recipients: number | null;
  scheduled_at: string | null;
  created_at: string;
};

function mapRow(r: Row): Campaign {
  return {
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    status: r.status as CampaignStatus,
    message: r.message_body,
    audienceSize: r.total_recipients ?? 0,
    scheduledAt: r.scheduled_at ?? undefined,
    createdAt: r.created_at,
  };
}

export const campaignService: CampaignService = {
  async list(params) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    try {
      const res = (await listCampaigns({
        data: { page, pageSize, search: params?.search },
      })) as { rows: Row[]; total: number };
      const items = res.rows.map(mapRow);
      const totalPages = Math.max(1, Math.ceil(res.total / pageSize));
      return { items, pagination: { page, pageSize, total: res.total, totalPages } };
    } catch (err) {
      console.error("[campaignService] list error:", err);
      return { items: [], pagination: { page, pageSize, total: 0, totalPages: 1 } };
    }
  },
  async getById(id) {
    const all = await this.list({ pageSize: 200 });
    return all.items.find((c) => c.id === id);
  },
  async create(input) {
    const row = (await upsertCampaign({
      data: {
        name: input.name,
        message_body: input.message,
        scheduled_at: input.scheduledAt,
      },
    })) as Row;
    return mapRow(row);
  },
  async update(id, patch) {
    const row = (await upsertCampaign({
      data: {
        id,
        name: patch.name,
        message_body: patch.message,
        scheduled_at: patch.scheduledAt,
      },
    })) as Row;
    return mapRow(row);
  },
  async remove(id) {
    await deleteCampaign({ data: { id } });
  },
  async duplicate(id) {
    const row = (await duplicateCampaign({ data: { id } })) as Row;
    return mapRow(row);
  },
  async setStatus(id, status) {
    if (status === "canceled") {
      await cancelCampaign({ data: { id } });
    }
    const row = (await upsertCampaign({ data: { id, status } })) as Row;
    return mapRow(row);
  },
};
