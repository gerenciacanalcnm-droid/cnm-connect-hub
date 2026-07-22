export const themeConfig = {
  defaultMode: "system" as "light" | "dark" | "system",
  brand: {
    primary: "cnm-blue",
    accent: "nova-purple",
  },
} as const;

export type ThemeConfig = typeof themeConfig;
