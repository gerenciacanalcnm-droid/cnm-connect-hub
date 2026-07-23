import { useQuery } from "@tanstack/react-query";
import { notificationRepository } from "@/repositories/notification.repository";
import { queryKeys } from "./queries/keys";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationRepository.list(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: () => notificationRepository.unreadCount(),
  });
}
