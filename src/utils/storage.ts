const hasWindow = typeof window !== "undefined";

export const storage = {
  get<T>(key: string): T | null {
    if (!hasWindow) return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    if (!hasWindow) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota */
    }
  },
  remove(key: string): void {
    if (!hasWindow) return;
    window.localStorage.removeItem(key);
  },
};
