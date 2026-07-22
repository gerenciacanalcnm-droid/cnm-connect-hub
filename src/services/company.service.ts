import type { Company } from "@/types/company";
import { companyConfig } from "@/config/company.config";

export interface CompanyService {
  getCurrent(): Promise<Company>;
  update(patch: Partial<Company>): Promise<Company>;
}

export const companyService: CompanyService = {
  async getCurrent(): Promise<Company> {
    return { ...(companyConfig as unknown as Company) };
  },
  async update() {
    throw new Error("companyService.update not implemented");
  },
};
