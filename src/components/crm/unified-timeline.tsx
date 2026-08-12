import { useMemo, useState } from "react";
import {
  MessageSquare,
  MessageCircle,
  Mail,
  Sparkles,
  Phone,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline, type TimelineItem } from "@/components/common/activity-timeline";
import { EmptyState } from "@/components/common/empty-state";
import { Loader } from "@/components/common/loader";
import { useConversations } from "@/hooks/use-communication";
import { cn } from "@/lib/utils";

type Kind = "sms" | "whatsapp" | "email" | "ia" | "llamada" | "nota";

const KIND_META: Record<Kind, { label: string; icon: LucideIcon; tone: TimelineItem["tone"] }> = {
  sms: { label: "SMS", icon: MessageSquare, tone: "primary" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, tone: "success" },
  email: { label: "Email", icon: Mail, tone: "info" },
  ia: { label: "IA", icon: Sparkles, tone: "nova" },
  llamada: { label: "Llamadas", icon: Phone, tone: "warning" },
  nota: { label: "Notas", icon: StickyNote, tone: "neutral" },
};

const KINDS = Object.keys(KIND_META) as Kind[];

/** Timeline unificado del CRM: todas las interacciones en un solo hilo. */
export function UnifiedTimeline() {
  const [active, setActive] = useState<Kind[]>(KINDS);
  const conversationsQuery = useConversations();
  const conversations = (conversationsQuery.data ?? []) as any[];
  const isLoading = conversationsQuery.isLoading;


  const items = useMemo<TimelineItem[]>(() => {
    return conversations
      .filter((c) => active.includes(c.channel as Kind))
      .map((c) => {
        const meta = KIND_META[c.channel as Kind] ?? KIND_META.nota;
        return {
          id: c.id,
          time: c.lastMessageAt
            ? new Date(c.lastMessageAt).toLocaleString("es-CO", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
          title: `${meta.label} · ${c.contactName ?? c.contactPhone}`,
          description: c.lastMessagePreview ?? "Sin mensajes registrados",
          icon: meta.icon,
          tone: meta.tone,
        };
      });
  }, [conversations, active]);

  const toggle = (k: Kind) =>
    setActive((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline unificado</CardTitle>
        <CardDescription>
          SMS, WhatsApp, Email, IA, llamadas y notas registrados en un único hilo por contacto.
        </CardDescription>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {KINDS.map((k) => {
            const { label, icon: Icon } = KIND_META[k];
            const on = active.includes(k);
            return (
              <Button
                key={k}
                size="sm"
                variant={on ? "secondary" : "outline"}
                className={cn("h-7 gap-1.5 text-xs", !on && "text-muted-foreground")}
                onClick={() => toggle(k)}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Sin interacciones registradas"
            description="Cuando se registren mensajes, llamadas o notas aparecerán aquí de forma unificada."
          />
        ) : (
          <ActivityTimeline items={items} />
        )}
      </CardContent>
    </Card>
  );
}
