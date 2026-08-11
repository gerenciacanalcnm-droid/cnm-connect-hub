import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { useWhatsAppSchedules, useCancelWhatsAppSchedule } from "@/hooks/use-whatsapp";
import { Button } from "@/components/ui/button";
import { XCircle, Calendar, MessageCircle, Account } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export function WhatsAppSchedules() {
  const { data: schedules = [], isLoading, error, refetch } = useWhatsAppSchedules();
  const cancelMutation = useCancelWhatsAppSchedule();

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("Programación cancelada");
    } catch (err: any) {
      toast.error(err.message || "Error al cancelar");
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: "scheduled_at",
      header: "Programado para",
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-emerald-900">
            {new Date(row.original.scheduled_at).toLocaleString("es-CO", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase">{row.original.timezone}</span>
        </div>
      ),
    },
    {
      accessorKey: "whatsapp_accounts.alias",
      header: "Cuenta",
      cell: ({ row }: any) => (
        <span className="text-xs font-medium px-2 py-1 bg-muted rounded border">
          {row.original.whatsapp_accounts?.alias || 'Meta Cloud'}
        </span>
      )
    },
    {
      accessorKey: "recipients",
      header: "Destinatarios",
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.original.recipients?.length || 0} números</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
            {row.original.recipients?.join(", ")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "message_body",
      header: "Mensaje / Plantilla",
      cell: ({ row }: any) => (
        <div className="flex flex-col max-w-[250px]">
          {row.original.template_id ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> {row.original.whatsapp_templates?.name || 'Plantilla'}
            </span>
          ) : (
            <span className="text-sm line-clamp-2 italic text-muted-foreground">
              {row.original.message_body}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "estimated_cost",
      header: "Costo Est.",
      cell: ({ row }: any) => (
        <span className="font-mono text-xs">{formatCurrency(row.original.estimated_cost)}</span>
      )
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        row.original.status === 'PROGRAMADO' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleCancel(row.original.id)}
            disabled={cancelMutation.isPending}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )
      ),
    },
  ], [cancelMutation.isPending]);

  if (isLoading) return <SkeletonTable rows={5} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Calendar className="h-5 w-5 text-emerald-600" />
        <div>
          <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Programaciones de WhatsApp</h3>
          <p className="text-xs text-muted-foreground">Gestiona los envíos automáticos configurados por tu empresa.</p>
        </div>
      </div>
      
      <DataTable
        data={schedules}
        columns={columns}
        searchPlaceholder="Buscar por destinatario o plantilla..."
        emptyTitle="No hay programaciones activas"
        emptyDescription="Configura una programación en la pestaña de WhatsApp para verla aquí."
      />
    </div>
  );
}
