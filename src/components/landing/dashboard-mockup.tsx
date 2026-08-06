import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mockup del Dashboard de SMS CNM.
 * NO usa imágenes de stock — todo está construido con el mismo Design System
 * del producto real (colores, tipografías, utilidades gradient-brand, etc.).
 */
export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl",
        className,
      )}
    >
      {/* Chrome */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <div className="rounded-md border border-border/60 bg-background/60 px-3 py-1 text-[10px] font-medium text-muted-foreground">
          sms.canalcnm.com/dashboard
        </div>
        <div className="h-4 w-10" />
      </div>

      <div className="grid grid-cols-[180px_1fr]">
        {/* Sidebar */}
        <aside className="hidden border-r border-border/70 bg-sidebar p-3 sm:block">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="grid h-6 w-6 place-items-center rounded-md gradient-brand text-[10px] font-bold text-primary-foreground">
              C
            </div>
            <span className="text-[11px] font-semibold text-sidebar-foreground">SMS CNM</span>
          </div>
          <div className="mt-3 space-y-0.5">
            {[
              { i: Activity, label: "Dashboard", active: true },
              { i: MessageSquare, label: "Comunicación" },
              { i: Users, label: "CRM" },
              { i: TrendingUp, label: "Analytics" },
              { i: Wallet, label: "Finanzas" },
              { i: Sparkles, label: "CNM Nova" },
            ].map(({ i: Icon, label, active }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70",
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 p-4">
          {/* Nova banner */}
          <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-3">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-nova/25 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.15]" />
            <div className="relative flex items-center gap-2">
              <div className="grid h-6 w-6 place-items-center rounded-md gradient-nova text-white">
                <Sparkles className="h-3 w-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-nova">
                  CNM Nova
                </div>
                <div className="truncate text-[11px] text-foreground">
                  Buenos días, Andrés · 4 recomendaciones listas
                </div>
              </div>
            </div>
          </div>

          {/* KPI grid */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Saldo", value: "$4.820.000", tone: "primary" as const, delta: "+12%" },
              { label: "SMS hoy", value: "38.412", tone: "success" as const, delta: "+8%" },
              { label: "Entrega", value: "98,7%", tone: "info" as const, delta: "+0,3%" },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-lg border border-border/70 bg-background/60 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-sm bg-success/10 px-1 py-0.5 text-[9px] font-semibold text-success">
                    <ArrowUpRight className="h-2.5 w-2.5" />
                    {k.delta}
                  </span>
                </div>
                <div className="mt-1 text-[13px] font-semibold text-foreground">{k.value}</div>
                {/* Sparkline */}
                <svg viewBox="0 0 100 24" className="mt-1.5 h-6 w-full">
                  <defs>
                    <linearGradient id={`spark-${k.label}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(var(--primary-raw))" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="oklch(var(--primary-raw))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,18 L14,14 L28,16 L42,10 L56,12 L70,6 L84,8 L100,3 L100,24 L0,24 Z"
                    fill={`url(#spark-${k.label})`}
                  />
                  <path
                    d="M0,18 L14,14 L28,16 L42,10 L56,12 L70,6 L84,8 L100,3"
                    fill="none"
                    stroke="oklch(var(--primary-raw))"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            ))}
          </div>

          {/* Chart card */}
          <div className="mt-3 rounded-lg border border-border/70 bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Envíos últimos 7 días
                </div>
                <div className="mt-0.5 text-sm font-semibold text-foreground">248.930</div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[10px] text-muted-foreground">
                <Send className="h-3 w-3" />
                SMS
              </div>
            </div>
            <div className="mt-2 flex h-16 items-end gap-1.5">
              {[40, 55, 48, 72, 62, 88, 96].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                  className="flex-1 rounded-t-sm gradient-brand opacity-80"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
