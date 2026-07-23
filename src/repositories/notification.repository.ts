import { notificationService, type NotificationService } from "@/services/notification.service";
export const notificationRepository: NotificationService = {
  list: () => notificationService.list(),
  unreadCount: () => notificationService.unreadCount(),
  markAsRead: (id) => notificationService.markAsRead(id),
  markAllRead: () => notificationService.markAllRead(),
};
