import { useMemo, useState } from "react";
import { Plus, Play, Pause, Copy, Trash2, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmsComposer } from "./sms-composer";
import { useCampaigns } from "@/hooks/use-campaigns";
import type { Campaign } from "@/types/campaign";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";

export function CampaignsList() {
  const { data, isLoading, error, refetch } = useCampaigns({ pageSize: 100 });
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const columns = useMemo<ColumnDef<Campaign>[]>(
    () => [
      { accessorKey: "name", header: "Campaña", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      { accessorKey: "status", header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "audienceSize", header: "Audiencia", cell: ({ row }) => formatNumber(row.original.audienceSize) },
      {
        accessorKey: "scheduledAt",
        header: "Programada",
        cell: ({ row }) =>
          row.original.scheduledAt
            ? new Date(row.original.scheduledAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
            : "—",
      },
      {
        accessorKey: "createdAt",
        header: "Creada",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("es-MX"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const c = row.original;
          const canRun = c.status === "paused" || c.status === "draft";
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canRun ? (
                  <DropdownMenuItem onClick={() => toast.success(`${c.name}: reanudada`)}>
                    <Play className="mr-2 h-4 w-4" /> Reanudar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => toast.success(`${c.name}: pausada`)}>
                    <Pause className="mr-2 h-4 w-4" /> Pausar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => toast.success(`${c.name}: duplicada`)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => toast.success(`${c.name}: eliminada`)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  if (isLoading) return <SkeletonTable rows={8} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <DataTable
        data={data?.items ?? []}
        columns={columns}
        searchPlaceholder="Buscar campañas…"
        exportFilename="campanas"
        enableSelection
        toolbar={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nueva campaña
          </Button>
        }
      />
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva campaña</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Black Friday 2026" />
            </div>
            <SmsComposer value={msg} onChange={setMsg} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success(`Campaña "${name}" creada`); setCreating(false); setName(""); setMsg(""); }}>
              Crear campaña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
