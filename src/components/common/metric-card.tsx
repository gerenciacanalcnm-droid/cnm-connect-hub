import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricCardProps = {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" | "neutral" };
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  hint,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-colors hover:border-border-strong",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          {Icon && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        {(delta || hint) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                  delta.direction === "up" &&
                    "bg-success/10 text-success",
                  delta.direction === "down" &&
                    "bg-destructive/10 text-destructive",
                  delta.direction === "neutral" &&
                    "bg-muted text-muted-foreground",
                )}
              >
                {delta.direction === "up" && (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                {delta.direction === "down" && (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {delta.value}
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
