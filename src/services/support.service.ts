export interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  createdAt: string;
}

export interface SupportService {
  listTickets(): Promise<SupportTicket[]>;
}

export const supportService: SupportService = {
  async listTickets() {
    return [];
  },
};
