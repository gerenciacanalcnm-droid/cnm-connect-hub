import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "info" | "warning" | "nova" | "neutral";
};

const toneStyles: Record<NonNullable<TimelineItem["tone"]>, string> = {
  primary: "bg-primary/10 text-primary ring-primary/20",
  success: "bg-success/10 text-success ring-success/20",
  info: "bg-info/10 text-info ring-info/20",
  warning: "bg-warning/15 text-warning ring-warning/25",
  nova: "bg-nova/10 text-nova ring-nova/20",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isLast = i === items.length - 1;
        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border"
              />
            )}
            <div
              className={cn(
                "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                toneStyles[item.tone ?? "neutral"],
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {item.time}
                </span>
              </div>
              {item.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
