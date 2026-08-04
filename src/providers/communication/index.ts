/**
 * Registry de proveedores de comunicación.
 * Punto único de resolución canal → proveedor.
 */
import type { CommunicationChannel } from "@/types/communication";
import type { CommunicationProvider } from "./communication-provider";
import { smsProvider } from "./sms.provider";
import { whatsappProvider } from "./whatsapp.provider";
import { emailProvider } from "./email.provider";

const registry: Record<CommunicationChannel, CommunicationProvider> = {
  sms: smsProvider,
  whatsapp: whatsappProvider,
  email: emailProvider,
};

export function getProvider(channel: CommunicationChannel): CommunicationProvider {
  return registry[channel];
}

export function listProviders(): CommunicationProvider[] {
  return Object.values(registry);
}

export * from "./communication-provider";
export { smsProvider, whatsappProvider, emailProvider };
