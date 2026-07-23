import { supportMock } from "./mocks/support.mock";

export interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  createdAt: string;
}

const DATA: SupportTicket[] = supportMock.list();

export interface SupportService {
  listTickets(): Promise<SupportTicket[]>;
  createTicket(input: { subject: string; message: string }): Promise<SupportTicket>;
}

export const supportService: SupportService = {
  async listTickets() {
    return DATA;
  },
  async createTicket(input) {
    const item: SupportTicket = {
      id: `tkt_${Math.random().toString(36).slice(2, 8)}`,
      subject: input.subject,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    DATA.unshift(item);
    return item;
  },
};
