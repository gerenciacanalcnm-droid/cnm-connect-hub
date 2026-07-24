import type { Notification } from "@/types/notification";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/platform.functions";

type Row = {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  read_at: string | null;
  created_at: string;
};

function mapRow(r: Row): Notification {
  return {
    id: r.id,
    title: r.title,
    body: r.body ?? "",
    level: (r.severity as Notification["level"]) ?? "info",
    read: !!r.read_at,
    createdAt: r.created_at,
  };
}

export interface NotificationService {
  list(): Promise<Notification[]>;
  unreadCount(): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  remove(id: string): Promise<void>;
}

export const notificationService: NotificationService = {
  async list() {
    try {
      const rows = (await listNotifications()) as Row[];
      return rows.map(mapRow);
    } catch (err) {
      console.error("[notificationService] list:", err);
      return [];
    }
  },
  async unreadCount() {
    const all = await this.list();
    return all.filter((n) => !n.read).length;
  },
  async markAsRead(id) {
    await markNotificationRead({ data: { id } });
  },
  async markAllRead() {
    await markAllNotificationsRead();
  },
  async remove(id) {
    await deleteNotification({ data: { id } });
  },
};
