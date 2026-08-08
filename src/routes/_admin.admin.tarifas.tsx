import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRateTiers, useRateTierMutations } from "@/hooks/use-commercial";
import type { CommercialChannel, RateTier } from "@/types/commercial";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/tarifas")({
  head: () => ({ meta: [{ title: "Tarifas — Super Admin" }] }),
  component: TarifasPage,
});

type Draft = {
  id?: string;
  channel: CommercialChannel;
  from_qty: number;
  to_qty: number;
  unit_price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
};

const CHANNELS: { value: CommercialChannel; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

function TarifasPage() {
  const { data: tiers = [], isLoading } = useRateTiers();
  const { upsert, remove } = useRateTierMutations();
  const [channel, setChannel] = useState<CommercialChannel>("sms");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    channel: "sms",
    from_qty: 0,
    to_qty: 0,
    unit_price: 0,
    currency: "COP",
    is_active: true,
    sort_order: 0,
  });

  const rows = useMemo(
    () => tiers.filter((t) => t.channel === channel).sort((a, b) => a.fromQty - b.fromQty),
    [tiers, channel],
  );

  const columns = useMemo<ColumnDef<RateTier, unknown>[]>(
    () => [
      {
        accessorKey: "fromQty",
        header: "Desde",
        cell: (c) => formatNumber(c.row.original.fromQty),
      },
      { accessorKey: "toQty", header: "Hasta", cell: (c) => formatNumber(c.row.original.toQty) },
      {
        accessorKey: "unitPrice",
        header: "Precio unitario",
        cell: (c) => (
          <span className="font-medium">
            {formatCurrency(c.row.original.unitPrice, c.row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "channel",
        header: "Canal",
        cell: (c) => <Badge variant="outline">{c.row.original.channel}</Badge>,
      },
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: (c) => (
          <Switch
            checked={c.row.original.isActive}
            onCheckedChange={(v) =>
              upsert.mutate({
                id: c.row.original.id,
                channel: c.row.original.channel,
                from_qty: c.row.original.fromQty,
                to_qty: c.row.original.toQty,
                unit_price: c.row.original.unitPrice,
                currency: c.row.original.currency,
                is_active: v,
                sort_order: c.row.original.sortOrder,
              })
            }
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar tarifa"
              onClick={() => {
                setDraft({
                  id: row.original.id,
                  channel: row.original.channel,
                  from_qty: row.original.fromQty,
                  to_qty: row.original.toQty,
                  unit_price: row.original.unitPrice,
                  currency: row.original.currency,
                  is_active: row.original.isActive,
                  sort_order: row.original.sortOrder,
                });
                setOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar tarifa"
              onClick={async () => {
                await remove.mutateAsync(row.original.id);
                toast.success("Tarifa eliminada");
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [remove, upsert],
  );

  const save = async () => {
    try {
      await upsert.mutateAsync({ ...draft });
      toast.success(draft.id ? "Tarifa actualizada" : "Tarifa creada");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la tarifa");
    }
  };

  return (
    <AdminPage
      title="Tarifas por volumen"
      description="Precio unitario por canal según el volumen mensual enviado."
      actions={
        <Button
          size="sm"
          onClick={() => {
            setDraft({
              channel,
              from_qty: 0,
              to_qty: 0,
              unit_price: 0,
              currency: "COP",
              is_active: true,
              sort_order: rows.length,
            });
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva tarifa
        </Button>
      }
    >
      <Tabs value={channel} onValueChange={(v) => setChannel(v as CommercialChannel)}>
        <TabsList>
          {CHANNELS.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            searchPlaceholder="Buscar tarifa…"
            exportFilename="tarifas"
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar tarifa" : "Nueva tarifa"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Desde</Label>
                <Input
                  type="number"
                  value={draft.from_qty}
                  onChange={(e) => setDraft((d) => ({ ...d, from_qty: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Hasta</Label>
                <Input
                  type="number"
                  value={draft.to_qty}
                  onChange={(e) => setDraft((d) => ({ ...d, to_qty: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Precio unitario</Label>
              <Input
                type="number"
                step="0.01"
                value={draft.unit_price}
                onChange={(e) => setDraft((d) => ({ ...d, unit_price: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label>Activa</Label>
              <Switch
                checked={draft.is_active}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {draft.id ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
