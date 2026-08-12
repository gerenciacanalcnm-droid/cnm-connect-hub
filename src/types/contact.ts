import type { ID } from "./common";
import type { CommunicationChannel } from "./communication";

export interface Contact {
  id: ID;
  companyId: ID;
  firstName: string;
  lastName?: string;
  /** Nombre completo calculado (GENERATED ALWAYS en DB). */
  name?: string;
  phone: string;
  /** Teléfono normalizado al formato Meta E.164. */
  normalizedPhone?: string;
  email?: string;
  tags: string[];
  createdAt: string;
  /** Canal preferido de contacto (omnicanal). */
  preferredChannel: CommunicationChannel;
  /** Número de WhatsApp cuando difiere del teléfono principal. */
  whatsappPhone?: string;
  /** Estado operativo del contacto (active, blocked, etc.). */
  status: string;
  /** Última conversación registrada en cualquier canal. */
  lastConversationAt?: string;
}
