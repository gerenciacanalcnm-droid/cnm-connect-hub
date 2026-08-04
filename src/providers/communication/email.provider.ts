import { BaseCommunicationProvider } from "./communication-provider";
import type { CommunicationChannel } from "@/types/communication";

/**
 * EmailProvider — Email Marketing (SMTP / proveedor transaccional).
 * Contrato listo; conexión diferida.
 */
export class EmailProvider extends BaseCommunicationProvider {
  readonly channel: CommunicationChannel = "email";
  readonly name = "SMTP / Email Gateway";
  override readonly ready = false;
}

export const emailProvider = new EmailProvider();
