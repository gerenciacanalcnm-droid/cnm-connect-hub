import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRechargeRequests, useWallets, useRechargeMutations } from "@/hooks/use-commercial";
import type { RechargeRequest } from "@/types/commercial";
import { formatCurrency } from "@/lib/format";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/recargas")({
  head: () => ({ meta: [{ title: "Recargas — Super Admin" }] }),
  component: RecargasPage,
});

const TONE: Record<RechargeRequest["reviewStatus"], string> = {
  pendiente: "border-amber-500/30 text-amber-600",
  aprobada: "border-success/40 text-success",
  rechazada: "border-destructive/30 text-destructive",
  anulada: "border-border text-muted-foreground",
};

function RecargasPage() {
  const { data: recharges = [], isLoading } = useRechargeRequests();
  const { data: wallets = [] } = useWallets();
  const { review } = useRechargeMutations();
  const [selected, setSelected] = useState<RechargeRequest | null>(null);
  const [note, setNote] = useState("");

  const pending = recharges.filter((r) => r.reviewStatus === "pendiente");
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const act = async (r: RechargeRequest, status: RechargeRequest["reviewStatus"]) => {
    await review.mutateAsync({ id: r.id, status, note });
    toast.success(status === "aprobada" ? "Recarga aprobada" : "Recarga rechazada");
    setSelected(null);
    setNote("");
  };

  const columns = useMemo<ColumnDef<RechargeRequest, unknown>[]>(
    () => [
      { accessorKey: "companyName", header: "Empresa" },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: (c) => (
          <span className="font-medium">
            {formatCurrency(c.row.original.amount, c.row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "channel",
        header: "Canal",
        cell: (c) => <Badge variant="outline">{c.row.original.channel}</Badge>,
      },
      { accessorKey: "mode", header: "Modo" },
      {
        accessorKey: "gatewayCode",
        header: "Pasarela",
        cell: (c) => c.row.original.gatewayCode ?? "—",
      },
      {
        accessorKey: "reviewStatus",
        header: "Estado",
        cell: (c) => (
          <Badge variant="outline" className={TONE[c.row.original.reviewStatus]}>
            {c.row.original.reviewStatus}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: (c) => new Date(c.row.original.createdAt).toLocaleDateString("es-CO"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Revisar recarga"
              onClick={() => {
                setSelected(row.original);
                setNote(row.original.reviewNote ?? "");
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <AdminPage title="Recargas" description="Solicitudes de recarga con aprobación manual.">
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pending.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Solicitudes totales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{recharges.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Saldo agregado en wallets
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totalBalance)}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <DataTable
          data={recharges}
          columns={columns}
          searchPlaceholder="Buscar empresa…"
          exportFilename="recargas"
        />
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar recarga — {selected?.companyName}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-medium">
                  {formatCurrency(selected.amount, selected.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal</span>
                <span>{selected.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comprobante</span>
                <span>{selected.receiptPath ? "Adjunto" : "Sin comprobante"}</span>
              </div>
              <div className="grid gap-1.5">
                <Label>Nota de revisión</Label>
                <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={review.isPending}
              onClick={() => selected && act(selected, "rechazada")}
            >
              <X className="mr-1.5 h-4 w-4" />
              Rechazar
            </Button>
            <Button
              disabled={review.isPending}
              onClick={() => selected && act(selected, "aprobada")}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
