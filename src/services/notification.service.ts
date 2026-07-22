import type { Notification } from "@/types/notification";

export interface NotificationService {
  list(): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
}

export const notificationService: NotificationService = {
  async list() {
    return [];
  },
  async markAsRead() {
    return;
  },
};
