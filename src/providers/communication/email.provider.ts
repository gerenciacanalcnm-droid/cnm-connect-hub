import { BaseCommunicationProvider } from "./communication-provider";
import type { CommunicationChannel } from "@/types/communication";

/**
 * EmailProvider — canal de correo transaccional y marketing.
 * Arquitectura preparada para Amazon SES (credenciales, región y remitente
 * verificado se resolverán desde el Settings Engine en la siguiente fase).
 * Sin conexión real todavía.
 */
export class EmailProvider extends BaseCommunicationProvider {
  readonly channel: CommunicationChannel = "email";
  readonly name = "Amazon SES (preparado)";
  override readonly ready = false;
}

export const emailProvider = new EmailProvider();
