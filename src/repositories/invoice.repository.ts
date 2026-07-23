import { invoiceService, type InvoiceService } from "@/services/invoice.service";
export const invoiceRepository: InvoiceService = {
  list: () => invoiceService.list(),
  getById: (id) => invoiceService.getById(id),
};
