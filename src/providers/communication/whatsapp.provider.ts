import { BaseCommunicationProvider } from "./communication-provider";
import type { CommunicationChannel } from "@/types/communication";

/**
 * WhatsAppProvider — Meta Cloud API.
 *
 * META READY: la arquitectura está preparada para que Meta Embedded Signup
 * complete automáticamente `businessAccountId`, `phoneNumberId`,
 * `accessToken`, `refreshToken`, `webhookVerifyToken` y `webhookSecret`
 * en `whatsapp_accounts`. Nunca se pedirán manualmente al cliente.
 *
 * Este Sprint NO realiza llamadas reales a Meta.
 */
export class WhatsAppProvider extends BaseCommunicationProvider {
  readonly channel: CommunicationChannel = "whatsapp";
  readonly name = "Meta Cloud API";
  override readonly ready = false;
}

export const whatsappProvider = new WhatsAppProvider();
