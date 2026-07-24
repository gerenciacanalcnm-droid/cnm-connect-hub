import type { Notification } from "@/types/notification";
import { notificationsMock } from "./mocks/notifications.mock";
import { listNotifications } from "@/lib/platform.functions";

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

let CACHE: Notification[] | null = null;

async function load(): Promise<Notification[]> {
  if (CACHE) return CACHE;
  try {
    const rows = (await listNotifications()) as Row[];
    CACHE = rows.length ? rows.map(mapRow) : notificationsMock.list();
  } catch (err) {
    console.error("[notificationService] fallback a mock:", err);
    CACHE = notificationsMock.list();
  }
  return CACHE!;
}

export interface NotificationService {
  list(): Promise<Notification[]>;
  unreadCount(): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export const notificationService: NotificationService = {
  async list() {
    return load();
  },
  async unreadCount() {
    const all = await load();
    return all.filter((n) => !n.read).length;
  },
  async markAsRead(nid) {
    const all = await load();
    const n = all.find((x) => x.id === nid);
    if (n) n.read = true;
  },
  async markAllRead() {
    const all = await load();
    all.forEach((n) => (n.read = true));
  },
};
