import { supportService, type SupportTicket } from "@/services/support.service";

export interface SupportRepository {
  listTickets(): Promise<SupportTicket[]>;
}

export const supportRepository: SupportRepository = {
  listTickets: () => supportService.listTickets(),
};
