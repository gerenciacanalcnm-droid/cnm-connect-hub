import type {
  WhatsAppAccount,
  WhatsAppAccountInput,
  CommunicationTemplate,
  ChannelCampaign,
} from "@/types/communication";
import {
  listWhatsAppAccounts,
  upsertWhatsAppAccount,
  deleteWhatsAppAccount,
  setPrimaryWhatsAppAccount,
  listWhatsAppTemplates,
  upsertWhatsAppTemplate,
  deleteWhatsAppTemplate,
  listWhatsAppCampaigns,
  createWhatsAppCampaign,
} from "@/lib/communication.functions";

type AccountRow = {
  id: string;
  company_id: string;
  alias: string;
  department: string;
  display_phone: string | null;
  status: string;
  is_primary: boolean;
  provider: string;
  business_account_id: string | null;
  phone_number_id: string | null;
  waba_name: string | null;
  quality_rating: string | null;
  verified_name: string | null;
  webhook_url: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapAccount(r: AccountRow): WhatsAppAccount {
  return {
    id: r.id,
    companyId: r.company_id,
    alias: r.alias,
    department: r.department as WhatsAppAccount["department"],
    displayPhone: r.display_phone ?? undefined,
    status: r.status as WhatsAppAccount["status"],
    isPrimary: r.is_primary,
    provider: r.provider,
    businessAccountId: r.business_account_id ?? undefined,
    phoneNumberId: r.phone_number_id ?? undefined,
    wabaName: r.waba_name ?? undefined,
    qualityRating: r.quality_rating ?? undefined,
    verifiedName: r.verified_name ?? undefined,
    webhookUrl: r.webhook_url ?? undefined,
    lastSyncedAt: r.last_synced_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

type TemplateRow = {
  id: string;
  company_id: string;
  name: string;
  category: string;
  language: string;
  header: string | null;
  body: string;
  footer: string | null;
  variables: unknown;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapTemplate(r: TemplateRow): CommunicationTemplate {
  return {
    id: r.id,
    companyId: r.company_id,
    channel: "whatsapp",
    name: r.name,
    category: r.category,
    language: r.language,
    header: r.header ?? undefined,
    body: r.body,
    footer: r.footer ?? undefined,
    variables: Array.isArray(r.variables) ? (r.variables as string[]) : [],
    version: r.version,
    status: r.status as CommunicationTemplate["status"],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface WhatsAppService {
  listAccounts(): Promise<WhatsAppAccount[]>;
  saveAccount(input: WhatsAppAccountInput & { id?: string }): Promise<void>;
  removeAccount(id: string): Promise<void>;
  makePrimary(id: string): Promise<void>;
  listTemplates(): Promise<CommunicationTemplate[]>;
  saveTemplate(input: {
    id?: string;
    name: string;
    category: string;
    language: string;
    header?: string;
    body: string;
    footer?: string;
    variables?: string[];
  }): Promise<void>;
  removeTemplate(id: string): Promise<void>;
  listCampaigns(): Promise<ChannelCampaign[]>;
  createCampaign(input: { name: string; templateId?: string; scheduledAt?: string }): Promise<void>;
}

export const whatsappService: WhatsAppService = {
  async listAccounts() {
    try {
      const rows = (await listWhatsAppAccounts()) as AccountRow[];
      return rows.map(mapAccount);
    } catch (err) {
      console.error("[whatsappService] listAccounts:", err);
      return [];
    }
  },
  async saveAccount(input) {
    await upsertWhatsAppAccount({
      data: {
        id: input.id,
        alias: input.alias,
        department: input.department,
        displayPhone: input.displayPhone ?? null,
        isPrimary: input.isPrimary,
      },
    });
  },
  async removeAccount(id) {
    await deleteWhatsAppAccount({ data: { id } });
  },
  async makePrimary(id) {
    await setPrimaryWhatsAppAccount({ data: { id } });
  },
  async listTemplates() {
    try {
      const rows = (await listWhatsAppTemplates()) as TemplateRow[];
      return rows.map(mapTemplate);
    } catch (err) {
      console.error("[whatsappService] listTemplates:", err);
      return [];
    }
  },
  async saveTemplate(input) {
    await upsertWhatsAppTemplate({
      data: {
        id: input.id,
        name: input.name,
        category: input.category,
        language: input.language,
        header: input.header ?? null,
        body: input.body,
        footer: input.footer ?? null,
        variables: input.variables ?? [],
      },
    });
  },
  async removeTemplate(id) {
    await deleteWhatsAppTemplate({ data: { id } });
  },
  async listCampaigns() {
    try {
      const rows = (await listWhatsAppCampaigns()) as Array<Record<string, unknown>>;
      return rows.map((r) => ({
        id: String(r["id"]),
        companyId: String(r["company_id"]),
        channel: "whatsapp" as const,
        name: String(r["name"]),
        status: String(r["status"]),
        templateId: (r["template_id"] as string | null) ?? undefined,
        scheduledAt: (r["scheduled_at"] as string | null) ?? undefined,
        totalRecipients: Number(r["total_recipients"] ?? 0),
        totalSent: Number(r["total_sent"] ?? 0),
        totalDelivered: Number(r["total_delivered"] ?? 0),
        totalRead: Number(r["total_read"] ?? 0),
        totalFailed: Number(r["total_failed"] ?? 0),
        cost: Number(r["cost"] ?? 0),
        createdAt: String(r["created_at"]),
      }));
    } catch (err) {
      console.error("[whatsappService] listCampaigns:", err);
      return [];
    }
  },
  async createCampaign(input) {
    await createWhatsAppCampaign({
      data: {
        name: input.name,
        templateId: input.templateId ?? null,
        scheduledAt: input.scheduledAt ?? null,
      },
    });
  },
};
