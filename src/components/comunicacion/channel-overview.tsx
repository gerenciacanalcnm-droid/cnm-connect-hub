import { motion } from "framer-motion";
import { MessageSquare, MessageCircle, Mail, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useChannelAnalytics, useCommunicationProviders } from "@/hooks/use-communication";
import { formatCurrency } from "@/utils/currency";
import type { CommunicationChannel } from "@/types/communication";

const CHANNEL_META: Record<
  CommunicationChannel,
  { label: string; icon: typeof MessageSquare; accent: string }
> = {
  sms: { label: "SMS", icon: MessageSquare, accent: "text-primary" },
  whatsapp: { label: "WhatsApp Business", icon: MessageCircle, accent: "text-emerald-500" },
  email: { label: "Email", icon: Mail, accent: "text-sky-500" },
};

export function ChannelOverview() {
  const { data, isLoading } = useChannelAnalytics();
  const providers = useCommunicationProviders();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  const channels: CommunicationChannel[] = ["sms", "whatsapp", "email"];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {channels.map((channel, i) => {
        const meta = CHANNEL_META[channel];
        const Icon = meta.icon;
        const stats = data?.[channel];
        const provider = providers.find((p) => p.channel === channel);
        return (
          <motion.div
            key={channel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Card className="h-full overflow-hidden border-border/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted">
                      <Icon className={`h-4.5 w-4.5 ${meta.accent}`} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{provider?.name}</p>
                    </div>
                  </div>
                  <Badge variant={provider?.ready ? "default" : "outline"} className="text-[10px]">
                    {provider?.ready ? "Activo" : "Pronto"}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{stats?.sent ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Enviados</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{stats?.delivered ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Entregados</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{stats?.failed ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Fallidos</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Entrega {stats?.deliveryRate ?? 0}%
                  </span>
                  <span className="font-medium">{formatCurrency(stats?.cost ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
