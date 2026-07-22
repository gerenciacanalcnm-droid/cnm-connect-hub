import type { ID } from "./common";

export interface Notification {
  id: ID;
  title: string;
  body: string;
  read: boolean;
  level: "info" | "success" | "warning" | "error";
  createdAt: string;
}
