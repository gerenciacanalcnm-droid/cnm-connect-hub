import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}
