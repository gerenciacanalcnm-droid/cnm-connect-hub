import type { ID } from "./common";

export interface Company {
  id: ID;
  name: string;
  product: string;
  domain: string;
  website: string;
  logoUrl: string;
  supportEmail: string;
  whatsapp: string;
  currency: string;
  locale: string;
  timezone: string;
}
