import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notificationRepository } from "@/repositories/notification.repository";
import { queryKeys } from "./queries/keys";

export function useNotifications() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationRepository.list(),
  });

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: queryKeys.notifications });
        qc.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: () => notificationRepository.unreadCount(),
  });
}
