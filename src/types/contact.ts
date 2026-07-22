import type { ID } from "./common";

export interface Contact {
  id: ID;
  companyId: ID;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  tags: string[];
  createdAt: string;
}
