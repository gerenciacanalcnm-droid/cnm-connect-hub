import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Widget({
  title,
  actions,
  children,
  footer,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          {title && <CardTitle className="text-sm font-semibold">{title}</CardTitle>}
          {actions}
        </CardHeader>
      )}
      <CardContent className="flex-1 pt-0">{children}</CardContent>
      {footer && (
        <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}
