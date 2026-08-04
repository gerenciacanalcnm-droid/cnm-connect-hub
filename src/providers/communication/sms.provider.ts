import { BaseCommunicationProvider } from "./communication-provider";
import type { CommunicationChannel } from "@/types/communication";

/**
 * SMSProvider — canal SMS.
 * La implementación real se inyectará cuando el proveedor autorice la IP
 * de salida. Hasta entonces expone el contrato sin ejecutar envíos.
 */
export class SmsProvider extends BaseCommunicationProvider {
  readonly channel: CommunicationChannel = "sms";
  readonly name = "SMS Gateway";
  override readonly ready = false;
}

export const smsProvider = new SmsProvider();
