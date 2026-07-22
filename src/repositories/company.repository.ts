import { companyService } from "@/services/company.service";
import type { Company } from "@/types/company";

export interface CompanyRepository {
  getCurrent(): Promise<Company>;
  update(patch: Partial<Company>): Promise<Company>;
}

export const companyRepository: CompanyRepository = {
  getCurrent: () => companyService.getCurrent(),
  update: (patch) => companyService.update(patch),
};
