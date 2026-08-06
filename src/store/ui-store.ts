import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "es" | "en";

type UIState = {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  novaOpen: boolean;
  notificationsOpen: boolean;
  locale: Locale;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (v: boolean) => void;
  setNovaOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
  setLocale: (l: Locale) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandOpen: false,
      novaOpen: false,
      notificationsOpen: false,
      locale: "es",
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandOpen: (v) => set({ commandOpen: v }),
      setNovaOpen: (v) => set({ novaOpen: v }),
      setNotificationsOpen: (v) => set({ notificationsOpen: v }),
      setLocale: (l) => set({ locale: l }),
    }),
    { name: "sms-cnm-ui" },
  ),
);
