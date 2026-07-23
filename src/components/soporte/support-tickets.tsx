import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useSupport } from "@/hooks/use-support";
import { supportService, type SupportTicket } from "@/services/support.service";
import { queryKeys } from "@/hooks/queries/keys";

export function SupportTickets() {
  const { data, isLoading, error, refetch } = useSupport();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const columns = useMemo<ColumnDef<SupportTicket>[]>(() => [
    {
      accessorKey: "id", header: "Ticket",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-mono text-xs">
          <LifeBuoy className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original.id}
        </div>
      ),
    },
    { accessorKey: "subject", header: "Asunto" },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: "createdAt", header: "Creado",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("es-MX"),
    },
  ], []);

  const submit = async () => {
    if (!subject || !message) return toast.error("Completa asunto y mensaje");
    await supportService.createTicket({ subject, message });
    qc.invalidateQueries({ queryKey: queryKeys.support });
    toast.success("Ticket creado");
    setOpen(false); setSubject(""); setMessage("");
  };

  if (isLoading) return <SkeletonTable rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><MessageSquarePlus className="h-4 w-4" /> Nuevo ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Abrir ticket de soporte</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-sub">Asunto</Label>
                <Input id="t-sub" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-msg">Mensaje</Label>
                <Textarea id="t-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
              </div>
            </div>
            <DialogFooter><Button onClick={submit}>Enviar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={data ?? []} columns={columns} />
    </div>
  );
}
