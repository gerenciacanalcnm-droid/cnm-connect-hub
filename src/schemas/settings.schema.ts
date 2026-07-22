import { z } from "zod";

export const settingsSchema = z.object({
  features: z.record(z.string(), z.boolean()),
  ui: z.object({
    sidebarDefaultCollapsed: z.boolean(),
    density: z.enum(["comfortable", "compact"]),
  }),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
  }),
});

export type SettingsDTO = z.infer<typeof settingsSchema>;
