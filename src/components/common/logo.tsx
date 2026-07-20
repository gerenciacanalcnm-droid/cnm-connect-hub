import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg gradient-brand shadow-sm">
        <span className="text-[13px] font-bold leading-none text-primary-foreground">
          C
        </span>
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
      {showWordmark && (
        <div className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            SMS CNM
          </span>
          <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            CNM Digital Media
          </span>
        </div>
      )}
    </div>
  );
}
