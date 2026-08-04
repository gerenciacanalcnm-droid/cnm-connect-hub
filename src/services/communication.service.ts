import type { ChannelAnalytics, CommunicationSettings } from "@/types/communication";
import { getChannelAnalytics } from "@/lib/communication.functions";
import { getGlobalSettings } from "@/lib/platform.functions";
import { listProviders } from "@/providers/communication";

const DEFAULTS: CommunicationSettings = {
  smsProvider: "SMS Gateway",
  whatsappProvider: "Meta Cloud API",
  emailProvider: "SMTP",
  scheduleStart: "08:00",
  scheduleEnd: "20:00",
  rateLimitPerMinute: 600,
  timeoutSeconds: 30,
  retries: 3,
  signature: "CNM Nova",
};

export interface CommunicationService {
  analytics(): Promise<Record<"sms" | "whatsapp" | "email", ChannelAnalytics>>;
  settings(): Promise<CommunicationSettings>;
  providers(): Array<{ channel: string; name: string; ready: boolean }>;
}

export const communicationService: CommunicationService = {
  async analytics() {
    try {
      return (await getChannelAnalytics()) as Record<
        "sms" | "whatsapp" | "email",
        ChannelAnalytics
      >;
    } catch (err) {
      console.error("[communicationService] analytics:", err);
      const empty = (channel: ChannelAnalytics["channel"]): ChannelAnalytics => ({
        channel,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        cost: 0,
        deliveryRate: 0,
      });
      return { sms: empty("sms"), whatsapp: empty("whatsapp"), email: empty("email") };
    }
  },
  async settings() {
    try {
      const raw = (await getGlobalSettings()) as string;
      const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      const ns = parsed["communication"] ?? {};
      return { ...DEFAULTS, ...(ns as Partial<CommunicationSettings>) };
    } catch (err) {
      console.error("[communicationService] settings:", err);
      return DEFAULTS;
    }
  },
  providers() {
    return listProviders().map((p) => ({ channel: p.channel, name: p.name, ready: p.ready }));
  },
};
