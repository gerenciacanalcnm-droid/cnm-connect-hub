import type { Notification } from "@/types/notification";
import { notificationsMock } from "./mocks/notifications.mock";

const DATA: Notification[] = notificationsMock.list();

export interface NotificationService {
  list(): Promise<Notification[]>;
  unreadCount(): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export const notificationService: NotificationService = {
  async list() {
    return DATA;
  },
  async unreadCount() {
    return DATA.filter((n) => !n.read).length;
  },
  async markAsRead(nid) {
    const n = DATA.find((x) => x.id === nid);
    if (n) n.read = true;
  },
  async markAllRead() {
    DATA.forEach((n) => (n.read = true));
  },
};
