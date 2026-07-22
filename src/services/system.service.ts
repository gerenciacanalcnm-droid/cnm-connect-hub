export interface SystemHealth {
  status: "ok" | "degraded" | "down";
  version: string;
  uptime: number;
}

export interface SystemService {
  health(): Promise<SystemHealth>;
}

export const systemService: SystemService = {
  async health() {
    return { status: "ok", version: "1.0.0", uptime: 0 };
  },
};
