import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAdminPromotions } from "@/hooks/use-admin-settings";
import type { Promotion } from "@/services/admin-settings.service";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/promociones")({
  head: () => ({ meta: [{ title: "Promociones — Super Admin" }] }),
  component: PromoPage,
});

function PromoPage() {
  const initial = useAdminPromotions();
  const [data, setData] = useState<Promotion[]>(initial);
  const [open, setOpen] = useState(false);
  const columns = useMemo<ColumnDef<Promotion, unknown>[]>(() => [
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "code", header: "Código", cell: (c) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.row.original.code}</code> },
    { accessorKey: "discount", header: "Descuento", cell: (c) => `${c.row.original.discount}%` },
    { accessorKey: "startsAt", header: "Inicio" },
    { accessorKey: "endsAt", header: "Fin" },
    { accessorKey: "auto", header: "Automática", cell: (c) => c.row.original.auto ? <Badge variant="outline" className="border-nova/40 text-nova">Auto</Badge> : "—" },
    { accessorKey: "active", header: "Estado", cell: (c) => (
      <Switch checked={c.row.original.active} onCheckedChange={(v) => setData((d) => d.map((x) => x.id === c.row.original.id ? { ...x, active: v } : x))} />
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setData((d) => d.filter((x) => x.id !== row.original.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ], []);

  return (
    <AdminPage
      title="Promociones"
      description="Códigos de descuento y campañas de aplicación automática."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Nueva promoción</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva promoción</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5"><Label>Nombre</Label><Input /></div>
              <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label>Código</Label><Input /></div><div className="grid gap-1.5"><Label>Descuento (%)</Label><Input type="number" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label>Inicio</Label><Input type="date" /></div><div className="grid gap-1.5"><Label>Fin</Label><Input type="date" /></div></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { setOpen(false); toast.success("Promoción creada"); }}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable data={data} columns={columns} searchPlaceholder="Buscar código…" exportFilename="promociones" />
    </AdminPage>
  );
}
