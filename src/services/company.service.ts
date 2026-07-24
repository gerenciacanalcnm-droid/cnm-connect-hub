import type { Company } from "@/types/company";
import { companyConfig } from "@/config/company.config";
import { getCurrentCompany } from "@/lib/platform.functions";

export interface CompanyService {
  getCurrent(): Promise<Company>;
  update(patch: Partial<Company>): Promise<Company>;
}

export const companyService: CompanyService = {
  async getCurrent(): Promise<Company> {
    try {
      const row = await getCurrentCompany();
      if (!row) return { ...(companyConfig as unknown as Company) };
      const meta = (row.metadata ?? {}) as Record<string, string>;
      return {
        id: row.id,
        name: row.name,
        product: meta.product ?? companyConfig.product,
        domain: meta.domain ?? companyConfig.domain,
        website: meta.website ?? companyConfig.website,
        logoUrl: row.logo_url ?? companyConfig.logoUrl,
        supportEmail: meta.supportEmail ?? companyConfig.supportEmail,
        whatsapp: meta.whatsapp ?? companyConfig.whatsapp,
        currency: row.currency ?? companyConfig.currency,
        locale: companyConfig.locale,
        timezone: row.timezone ?? companyConfig.timezone,
      };
    } catch (err) {
      console.error("[companyService] fallback a mock:", err);
      return { ...(companyConfig as unknown as Company) };
    }
  },
  async update() {
    throw new Error("companyService.update requiere auth + rol company_admin (próximo sprint).");
  },
};
