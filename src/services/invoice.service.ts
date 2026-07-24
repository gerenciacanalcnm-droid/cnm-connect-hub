import type { Invoice } from "@/types/invoice";

export interface InvoiceService {
  list(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | undefined>;
}

export const invoiceService: InvoiceService = {
  async list() { return []; },
  async getById() { return undefined; },
};
