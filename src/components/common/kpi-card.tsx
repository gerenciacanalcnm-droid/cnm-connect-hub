import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "info" | "nova" | "destructive";

const toneStyles: Record<
  Tone,
  { icon: string; ring: string; bar: string; spark: string }
> = {
  primary: {
    icon: "bg-primary/10 text-primary ring-primary/20",
    ring: "ring-primary/15",
    bar: "bg-primary",
    spark: "var(--color-primary)",
  },
  success: {
    icon: "bg-success/10 text-success ring-success/20",
    ring: "ring-success/15",
    bar: "bg-success",
    spark: "var(--color-success)",
  },
  warning: {
    icon: "bg-warning/15 text-warning ring-warning/25",
    ring: "ring-warning/15",
    bar: "bg-warning",
    spark: "var(--color-warning)",
  },
  info: {
    icon: "bg-info/10 text-info ring-info/20",
    ring: "ring-info/15",
    bar: "bg-info",
    spark: "var(--color-info)",
  },
  nova: {
    icon: "bg-nova/10 text-nova ring-nova/20",
    ring: "ring-nova/15",
    bar: "bg-nova",
    spark: "var(--color-nova)",
  },
  destructive: {
    icon: "bg-destructive/10 text-destructive ring-destructive/20",
    ring: "ring-destructive/15",
    bar: "bg-destructive",
    spark: "var(--color-destructive)",
  },
};

export type KpiCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: { value: string; direction: "up" | "down" | "neutral" };
  progress?: { value: number; max?: number; label?: string };
  sparkline?: number[];
  hint?: string;
  index?: number;
  className?: string;
};

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "primary",
  delta,
  progress,
  sparkline,
  hint,
  index = 0,
  className,
}: KpiCardProps) {
  const t = toneStyles[tone];
  const pct = progress
    ? Math.min(100, Math.max(0, (progress.value / (progress.max ?? 100)) * 100))
    : null;
  const data = sparkline?.map((y, i) => ({ i, y }));

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-all",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-[1.6rem]">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-medium text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
            t.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
                delta.direction === "up" && "bg-success/10 text-success",
                delta.direction === "down" &&
                  "bg-destructive/10 text-destructive",
                delta.direction === "neutral" &&
                  "bg-muted text-muted-foreground",
              )}
            >
              {delta.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
              {delta.direction === "down" && (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {delta.value}
            </span>
          )}
          {hint && (
            <span className="truncate text-muted-foreground">{hint}</span>
          )}
        </div>
      )}

      {pct !== null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
            <span>{progress?.label ?? "Uso"}</span>
            <span className="tabular-nums text-foreground">
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.2 + index * 0.04, duration: 0.6 }}
              className={cn("h-full rounded-full", t.bar)}
            />
          </div>
        </div>
      )}

      {data && (
        <div className="-mx-5 -mb-5 mt-4 h-14">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`spark-${tone}-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={t.spark} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={t.spark} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke={t.spark}
                strokeWidth={1.75}
                fill={`url(#spark-${tone}-${index})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.article>
  );
}
