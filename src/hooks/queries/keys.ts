export const queryKeys = {
  landing: ["landing"] as const,
  dashboard: ["dashboard"] as const,
  settings: ["settings"] as const,
  company: ["company"] as const,
  sms: (params?: unknown) => ["sms", params] as const,
  campaigns: (params?: unknown) => ["campaigns", params] as const,
  analytics: ["analytics"] as const,
  nova: ["nova"] as const,
  billing: {
    plans: ["billing", "plans"] as const,
    pricing: ["billing", "pricing"] as const,
    promotions: ["billing", "promotions"] as const,
  },
  support: ["support"] as const,
  notifications: ["notifications"] as const,
};
