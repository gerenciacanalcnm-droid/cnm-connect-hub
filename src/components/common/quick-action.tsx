import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickAction = {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
  tone?: "primary" | "nova" | "success" | "info" | "neutral";
};

const toneStyles: Record<NonNullable<QuickAction["tone"]>, string> = {
  primary: "text-primary bg-primary/10 ring-primary/20",
  nova: "text-nova bg-nova/10 ring-nova/20",
  success: "text-success bg-success/10 ring-success/20",
  info: "text-info bg-info/10 ring-info/20",
  neutral: "text-foreground bg-muted ring-border",
};

export function QuickActionButton({
  action,
  index = 0,
}: {
  action: QuickAction;
  index?: number;
}) {
  const Icon = action.icon;
  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-xs outline-none transition-colors hover:border-border-strong hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-105",
          toneStyles[action.tone ?? "primary"],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {action.label}
        </p>
        {action.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {action.description}
          </p>
        )}
      </div>
    </motion.button>
  );
}
