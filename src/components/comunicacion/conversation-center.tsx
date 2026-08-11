import { useMemo, useState } from "react";
import {
  MessageCircle,
  MessageSquare,
  Mail,
  Paperclip,
  Image as ImageIcon,
  Mic,
  FileText,
  Video,
  Send,
  Search,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { Loader } from "@/components/common/loader";
import {
  useConversations,
  useConversationMessages,
  useUpdateConversation,
  useSendWhatsApp,
  useCommunicationSettings,
} from "@/hooks/use-communication";
import type { CommunicationChannel, Conversation, ConversationStatus } from "@/types/communication";
import { cn } from "@/lib/utils";

const CHANNEL_ICON: Record<CommunicationChannel, typeof MessageSquare> = {
  sms: MessageSquare,
  whatsapp: MessageCircle,
  email: Mail,
};

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: "Abierta",
  pending: "Pendiente",
  closed: "Cerrada",
  archived: "Archivada",
};

const ATTACH = [
  { icon: ImageIcon, label: "Imagen" },
  { icon: Mic, label: "Audio" },
  { icon: FileText, label: "PDF" },
  { icon: Video, label: "Video" },
];

export function ConversationCenter() {
  const [channel, setChannel] = useState<"all" | CommunicationChannel>("all");
  const [status, setStatus] = useState<"all" | ConversationStatus>("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const filters = useMemo(
    () => ({
      ...(channel !== "all" ? { channel } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(search ? { search } : {}),
    }),
    [channel, status, search],
  );

  const { data: conversations = [], isLoading } = useConversations(filters);
  const { data: messages = [] } = useConversationMessages(activeId);
  const updateConv = useUpdateConversation();
  const sendWhatsApp = useSendWhatsApp();
  const { data: commSettings } = useCommunicationSettings();

  const handleSendReply = async () => {
    if (!active || !replyBody.trim()) return;

    // Obtener la cuenta de WhatsApp (accountId) vinculada a la conversación o la primaria
    const accountId = active.accountId;
    if (!accountId) {
      toast.error("No hay una cuenta de WhatsApp vinculada a esta conversación.");
      return;
    }

    try {
      await sendWhatsApp.mutateAsync({
        to: active.contactPhone,
        body: replyBody,
        accountId: accountId,
        conversationId: active.id,
      });
      setReplyBody("");
    } catch (err) {
      // Error manejado en el hook
    }
  };

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar conversación…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="open">Abiertas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="closed">Cerradas</SelectItem>
                <SelectItem value="archived">Archivadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <ScrollArea className="h-[420px] lg:h-[560px]">
          {isLoading ? (
            <div className="p-6">
              <Loader />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={MessageCircle}
                title="Sin conversaciones"
                description="Las conversaciones entrantes aparecerán aquí cuando los canales estén conectados."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  active={c.id === activeId}
                  onSelect={() => setActiveId(c.id)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>
      </Card>

      <Card className="flex min-h-[420px] flex-col lg:min-h-[620px]">
        {!active ? (
          <CardContent className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title="Selecciona una conversación"
              description="Elige un hilo para ver el historial omnicanal, adjuntos y asignaciones."
            />
          </CardContent>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {(active.contactName ?? active.contactPhone).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{active.contactName ?? active.contactPhone}</p>
                  <p className="text-xs text-muted-foreground">{active.contactPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {active.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
                <Select
                  value={active.status}
                  onValueChange={(v) =>
                    updateConv.mutate({ id: active.id, status: v as ConversationStatus })
                  }
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as ConversationStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Sin mensajes en este hilo todavía.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.direction === "outbound" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          m.direction === "outbound"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {m.mediaUrl ? (
                          <span className="flex items-center gap-2 text-xs">
                            <Paperclip className="h-3.5 w-3.5" /> Adjunto
                          </span>
                        ) : null}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(m.createdAt).toLocaleString("es-CO")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-2 border-t border-border p-3">
              <div className="flex flex-wrap gap-1.5">
                {ATTACH.map(({ icon: Icon, label }) => (
                  <Button key={label} size="sm" variant="outline" className="gap-1.5" disabled>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje…"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  disabled={sendWhatsApp.isPending}
                />
                <Button
                  className="gap-1.5"
                  onClick={handleSendReply}
                  disabled={!replyBody.trim() || sendWhatsApp.isPending}
                >
                  {sendWhatsApp.isPending ? (
                    <Loader size="sm" className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = CHANNEL_ICON[conversation.channel];
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/60",
          active && "bg-muted",
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">
              {conversation.contactName ?? conversation.contactPhone}
            </span>
            {conversation.unreadCount > 0 && (
              <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.lastMessagePreview ?? "Sin mensajes"}
          </p>
        </div>
      </button>
    </li>
  );
}
