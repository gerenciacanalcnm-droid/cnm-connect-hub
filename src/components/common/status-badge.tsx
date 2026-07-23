import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SmsStatus, CampaignStatus, UserStatus } from "@/constants/status";

type AnyStatus = SmsStatus | CampaignStatus | UserStatus | string;

const LABELS: Record<string, string> = {
  queued: "En cola",
  sending: "Enviando",
  sent: "Enviado",
  delivered: "Entregado",
  failed: "Fallido",
  rejected: "Rechazado",
  draft: "Borrador",
  scheduled: "Programada",
  running: "Activa",
  paused: "Pausada",
  completed: "Finalizada",
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  invited: "Invitado",
  paid: "Pagada",
  pending: "Pendiente",
  overdue: "Vencida",
  open: "Abierto",
  resolved: "Resuelto",
  closed: "Cerrado",
  revoked: "Revocada",
  failing: "Con fallos",
};

const TONES: Record<string, string> = {
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  sent: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  sending: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  queued: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  failing: "bg-destructive/15 text-destructive border-destructive/30",
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  running: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  paused: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
  closed: "bg-muted text-muted-foreground border-border",
  invited: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  open: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  revoked: "bg-muted text-muted-foreground border-border line-through",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const key = String(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        TONES[key] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {LABELS[key] ?? key}
    </Badge>
  );
}
