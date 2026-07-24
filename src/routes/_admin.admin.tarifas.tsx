import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy, Pencil, Trash2 } from "lucide-react";
import { defaultTariffs, type TariffTier } from "@/config/admin.config";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/tarifas" as never)({
  head: () => ({ meta: [{ title: "Tarifas — Super Admin" }] }),
  component: TarifasPage,
});

function TarifasPage() {
  const [data, setData] = useState<TariffTier[]>(defaultTariffs);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: 0, to: 0, price: 0 });

  const columns = useMemo<ColumnDef<TariffTier, unknown>[]>(() => [
    { accessorKey: "order", header: "#" },
    { accessorKey: "from", header: "Desde" },
    { accessorKey: "to", header: "Hasta" },
    { accessorKey: "price", header: "Precio unit.", cell: (c) => formatCurrency(c.row.original.price) },
    { accessorKey: "active", header: "Estado", cell: (c) => c.row.original.active ? <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activa</Badge> : <Badge variant="outline">Inactiva</Badge> },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setData((d) => [...d, { ...row.original, id: `t${Date.now()}`, order: d.length + 1 }]); toast.success("Tarifa duplicada"); }}><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setData((d) => d.filter((x) => x.id !== row.original.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ], []);

  return (
    <AdminPage
      title="Tarifas por volumen"
      description="Escalones dinámicos de precios por rango de SMS. Nunca escritos en código."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Nueva tarifa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva tarifa</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Desde</Label><Input type="number" onChange={(e) => setDraft((d) => ({ ...d, from: +e.target.value }))} /></div>
                <div className="grid gap-1.5"><Label>Hasta</Label><Input type="number" onChange={(e) => setDraft((d) => ({ ...d, to: +e.target.value }))} /></div>
              </div>
              <div className="grid gap-1.5"><Label>Precio unitario</Label><Input type="number" onChange={(e) => setDraft((d) => ({ ...d, price: +e.target.value }))} /></div>
              <div className="flex items-center justify-between rounded-md border border-border p-3"><Label>Activa</Label><Switch defaultChecked /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { setData((d) => [...d, { id: `t${Date.now()}`, ...draft, active: true, order: d.length + 1 }]); setOpen(false); toast.success("Tarifa creada"); }}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable data={data} columns={columns} searchPlaceholder="Buscar tarifa…" exportFilename="tarifas" />
    </AdminPage>
  );
}
