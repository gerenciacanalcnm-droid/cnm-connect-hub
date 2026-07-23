import type { Invoice } from "@/types/invoice";
import { invoicesMock } from "./mocks/invoices.mock";

const DATA: Invoice[] = invoicesMock.list();

export interface InvoiceService {
  list(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | undefined>;
}

export const invoiceService: InvoiceService = {
  async list() {
    return DATA;
  },
  async getById(iid) {
    return DATA.find((i) => i.id === iid);
  },
};
