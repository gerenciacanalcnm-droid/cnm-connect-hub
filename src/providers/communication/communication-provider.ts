/**
 * CommunicationProvider — capa de abstracción de canales.
 *
 * Define el contrato único que cumplen SMSProvider, WhatsAppProvider y
 * EmailProvider. Los Services consumen `getProvider(channel)` y nunca
 * conocen al proveedor concreto (Meta Cloud API, Twilio, SMTP, etc.).
 *
 * SOLID: Interface Segregation + Dependency Inversion.
 */
import type {
  ChannelAnalytics,
  CommunicationChannel,
} from "@/types/communication";

export interface SendPayload {
  to: string;
  body?: string;
  templateId?: string;
  variables?: Record<string, string>;
  mediaUrl?: string;
  subject?: string;
  from?: string;
}

export interface SendResult {
  id: string;
  status: "queued" | "sent" | "failed";
  externalId?: string;
  cost?: number;
}

export interface BulkSendPayload {
  recipients: string[];
  body?: string;
  templateId?: string;
  variables?: Record<string, string>;
  subject?: string;
  from?: string;
}

export interface BulkSendResult {
  jobId: string;
  accepted: number;
  rejected: number;
}

export interface HistoryQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface HistoryItem {
  id: string;
  to: string;
  body: string;
  status: string;
  createdAt: string;
  cost: number;
}

export interface CommunicationProvider {
  readonly channel: CommunicationChannel;
  readonly name: string;
  /** `false` mientras la integración oficial no esté activa. */
  readonly ready: boolean;

  send(payload: SendPayload): Promise<SendResult>;
  sendBulk(payload: BulkSendPayload): Promise<BulkSendResult>;
  schedule(payload: BulkSendPayload & { scheduleAt: string }): Promise<BulkSendResult>;
  cancel(jobId: string): Promise<{ ok: boolean }>;
  status(messageId: string): Promise<{ status: string }>;
  analytics(range?: { from: string; to: string }): Promise<ChannelAnalytics>;
  history(query?: HistoryQuery): Promise<{ items: HistoryItem[]; total: number }>;
}

/** Error estándar cuando el canal aún no tiene proveedor conectado. */
export class ChannelNotConnectedError extends Error {
  constructor(channel: CommunicationChannel) {
    super(
      `El canal ${channel.toUpperCase()} aún no está conectado. Disponible en la siguiente actualización.`,
    );
    this.name = "ChannelNotConnectedError";
  }
}

/** Base reutilizable: todos los métodos fallan hasta que el canal se conecte. */
export abstract class BaseCommunicationProvider implements CommunicationProvider {
  abstract readonly channel: CommunicationChannel;
  abstract readonly name: string;
  readonly ready: boolean = false;

  protected notConnected(): never {
    throw new ChannelNotConnectedError(this.channel);
  }

  send(_payload: SendPayload): Promise<SendResult> {
    return Promise.reject(new ChannelNotConnectedError(this.channel));
  }
  sendBulk(_payload: BulkSendPayload): Promise<BulkSendResult> {
    return Promise.reject(new ChannelNotConnectedError(this.channel));
  }
  schedule(_payload: BulkSendPayload & { scheduleAt: string }): Promise<BulkSendResult> {
    return Promise.reject(new ChannelNotConnectedError(this.channel));
  }
  cancel(_jobId: string): Promise<{ ok: boolean }> {
    return Promise.reject(new ChannelNotConnectedError(this.channel));
  }
  status(_messageId: string): Promise<{ status: string }> {
    return Promise.reject(new ChannelNotConnectedError(this.channel));
  }
  async analytics(): Promise<ChannelAnalytics> {
    return {
      channel: this.channel,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      cost: 0,
      deliveryRate: 0,
    };
  }
  async history(): Promise<{ items: HistoryItem[]; total: number }> {
    return { items: [], total: 0 };
  }
}
