const NOT_CONNECTED = new Error("Próximamente: el módulo de soporte se conectará en la siguiente fase.");

export interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  createdAt: string;
}

export interface SupportService {
  listTickets(): Promise<SupportTicket[]>;
  createTicket(input: { subject: string; message: string }): Promise<SupportTicket>;
}

export const supportService: SupportService = {
  async listTickets() { return []; },
  async createTicket() { throw NOT_CONNECTED; },
};
