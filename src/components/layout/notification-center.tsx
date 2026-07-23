import { Bell, Check, CheckCheck, Circle, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/store/ui-store";
import { useNotifications, useUnreadCount } from "@/hooks/use-notifications";
import { notificationRepository } from "@/repositories/notification.repository";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/keys";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Notification } from "@/types/notification";

const iconByLevel = {
  info: { Icon: Circle, className: "text-primary" },
  success: { Icon: Check, className: "text-success" },
  warning: { Icon: AlertTriangle, className: "text-warning" },
  error: { Icon: XCircle, className: "text-destructive" },
} as const;

export function NotificationCenter() {
  const open = useUIStore((s) => s.notificationsOpen);
  const setOpen = useUIStore((s) => s.setNotificationsOpen);
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const qc = useQueryClient();

  async function markAll() {
    await notificationRepository.markAllRead();
    qc.invalidateQueries({ queryKey: queryKeys.notifications });
    qc.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
  }

  async function markOne(id: string) {
    await notificationRepository.markAsRead(id);
    qc.invalidateQueries({ queryKey: queryKeys.notifications });
    qc.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full max-w-md p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notificaciones
              {unread > 0 && (
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                  {unread} nuevas
                </Badge>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAll}
              disabled={unread === 0}
              className="h-8 gap-1.5 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todo
            </Button>
          </div>
          <SheetDescription className="text-left text-xs text-muted-foreground">
            Actividad reciente de tu cuenta y campañas.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-6rem)]">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="grid place-items-center gap-3 px-5 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Estás al día. Sin notificaciones nuevas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n: Notification) => {
                const { Icon, className } = iconByLevel[n.level];
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "group flex gap-3 px-5 py-4 transition-colors hover:bg-accent/30",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background ring-1 ring-border", className)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                        </span>
                        {!n.read && (
                          <button
                            onClick={() => markOne(n.id)}
                            className="text-[11px] font-medium text-primary opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                          >
                            Marcar leída
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
