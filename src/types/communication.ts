/**
 * CNM Nova — Contratos de dominio del Communication Hub (omnicanal).
 * Fuente de verdad TypeScript para SMS, WhatsApp Business y Email Marketing.
 */
import type { ID } from "./common";

export type CommunicationChannel = "sms" | "whatsapp" | "email";

export const CHANNEL_LABEL: Record<CommunicationChannel, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
};

export type WhatsAppAccountStatus =
  | "disconnected"
  | "pending"
  | "connected"
  | "error"
  | "suspended";

export type WhatsAppDepartment = "ventas" | "soporte" | "cobranza" | "marketing" | "general";

export const DEPARTMENT_LABEL: Record<WhatsAppDepartment, string> = {
  ventas: "Ventas",
  soporte: "Soporte",
  cobranza: "Cobranza",
  marketing: "Marketing",
  general: "General",
};

/**
 * Cuenta de WhatsApp Business.
 * Los campos `businessAccountId`, `phoneNumberId`, `verifiedName` y
 * `qualityRating` los completará automáticamente Meta Embedded Signup.
 * Los tokens jamás viajan al cliente (revocados a nivel de columna en Postgres).
 */
export interface WhatsAppAccount {
  id: ID;
  companyId: ID;
  alias: string;
  department: WhatsAppDepartment;
  displayPhone?: string;
  status: WhatsAppAccountStatus;
  isPrimary: boolean;
  provider: string;
  businessAccountId?: string;
  phoneNumberId?: string;
  wabaName?: string;
  qualityRating?: string;
  verifiedName?: string;
  webhookUrl?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppAccountInput {
  alias: string;
  department: WhatsAppDepartment;
  displayPhone?: string;
  isPrimary?: boolean;
}

export type CommunicationTemplateStatus = "draft" | "pending" | "approved" | "rejected";

export interface CommunicationTemplate {
  id: ID;
  companyId: ID;
  channel: CommunicationChannel;
  name: string;
  category: string;
  language: string;
  header?: string;
  body: string;
  footer?: string;
  variables: string[];
  version: number;
  status: CommunicationTemplateStatus;
  updatedAt: string;
  createdAt: string;
}

export type ConversationStatus = "open" | "pending" | "closed" | "archived";

export interface Conversation {
  id: ID;
  companyId: ID;
  accountId?: ID;
  contactId?: ID;
  channel: CommunicationChannel;
  contactPhone: string;
  contactName?: string;
  status: ConversationStatus;
  assignedTo?: ID;
  tags: string[];
  unreadCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
}

export type ConversationMessageKind = "text" | "image" | "audio" | "video" | "document";

export interface ConversationMessage {
  id: ID;
  conversationId: ID;
  direction: "inbound" | "outbound";
  kind: ConversationMessageKind;
  body?: string;
  mediaUrl?: string;
  status: string;
  createdAt: string;
}

export interface ChannelCampaign {
  id: ID;
  companyId: ID;
  channel: CommunicationChannel;
  name: string;
  status: string;
  templateId?: ID;
  scheduledAt?: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalRead?: number;
  totalFailed: number;
  cost: number;
  createdAt: string;
}

export interface ChannelAnalytics {
  channel: CommunicationChannel;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  cost: number;
  deliveryRate: number;
}

/** Configuración por canal — servida por Settings Engine. */
export interface CommunicationSettings {
  smsProvider: string;
  whatsappProvider: string;
  emailProvider: string;
  scheduleStart: string;
  scheduleEnd: string;
  rateLimitPerMinute: number;
  timeoutSeconds: number;
  retries: number;
  signature: string;
  defaultTemplateId?: string;
}
