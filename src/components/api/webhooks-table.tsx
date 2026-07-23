import { useMemo, useState } from "react";
import { Plus, Trash2, Webhook } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useWebhooks } from "@/hooks/use-api-keys";
import { apiKeyRepository } from "@/repositories/api-key.repository";
import type { Webhook as Hook } from "@/types/api-key";
import { queryKeys } from "@/hooks/queries/keys";

export function WebhooksTable() {
  const { data, isLoading, error, refetch } = useWebhooks();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState("sms.delivered, sms.failed");

  const columns = useMemo<ColumnDef<Hook>[]>(() => [
    {
      accessorKey: "url", header: "Endpoint",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Webhook className="h-3.5 w-3.5 text-muted-foreground" />
          <code className="font-mono text-xs">{row.original.url}</code>
        </div>
      ),
    },
    {
      accessorKey: "events", header: "Eventos",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.events.map((e) => (
            <Badge key={e} variant="outline" className="font-mono text-[10px]">{e}</Badge>
          ))}
        </div>
      ),
    },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: "lastDeliveryAt", header: "Última entrega",
      cell: ({ row }) => row.original.lastDeliveryAt
        ? new Date(row.original.lastDeliveryAt).toLocaleString("es-MX")
        : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" className="text-destructive"
          onClick={async (e) => {
            e.stopPropagation();
            await apiKeyRepository.removeWebhook(row.original.id);
            qc.invalidateQueries({ queryKey: queryKeys.webhooks });
            toast.success("Webhook eliminado");
          }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [qc]);

  const submit = async () => {
    if (!url) return toast.error("URL requerida");
    await apiKeyRepository.createWebhook({
      url, events: events.split(",").map((e) => e.trim()).filter(Boolean),
    });
    qc.invalidateQueries({ queryKey: queryKeys.webhooks });
    toast.success("Webhook creado");
    setOpen(false); setUrl("");
  };

  if (isLoading) return <SkeletonTable rows={4} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> Nuevo webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar webhook</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="w-url">URL de destino</Label>
                <Input id="w-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.tuempresa.com/hooks" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-events">Eventos</Label>
                <Input id="w-events" value={events} onChange={(e) => setEvents(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
            <DialogFooter><Button onClick={submit}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={data ?? []} columns={columns} />
    </div>
  );
}
