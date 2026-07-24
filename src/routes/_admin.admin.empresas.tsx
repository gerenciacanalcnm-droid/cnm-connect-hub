import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Ban, Play } from "lucide-react";
import { generateAdminCompanies, type CompanyAdmin } from "@/services/mocks/admin.mock";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/empresas" as never)({
  head: () => ({ meta: [{ title: "Empresas — Super Admin" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const [data, setData] = useState<CompanyAdmin[]>(() => generateAdminCompanies());
  const [open, setOpen] = useState(false);

  const columns = useMemo<ColumnDef<CompanyAdmin, unknown>[]>(() => [
    { accessorKey: "name", header: "Empresa" },
    { accessorKey: "domain", header: "Dominio" },
    { accessorKey: "users", header: "Usuarios" },
    { accessorKey: "balance", header: "Saldo", cell: (c) => formatCurrency(c.row.original.balance) },
    { accessorKey: "consumption", header: "Consumo (SMS)" },
    { accessorKey: "status", header: "Estado", cell: (c) => <StatusBadge status={c.row.original.status} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
          {row.original.status === "active" ? (
            <Button variant="ghost" size="icon" aria-label="Suspender" onClick={() => { setData((d) => d.map((x) => x.id === row.original.id ? { ...x, status: "suspended" } : x)); toast.success("Empresa suspendida"); }}><Ban className="h-4 w-4" /></Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Activar" onClick={() => { setData((d) => d.map((x) => x.id === row.original.id ? { ...x, status: "active" } : x)); toast.success("Empresa activada"); }}><Play className="h-4 w-4" /></Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => { setData((d) => d.filter((x) => x.id !== row.original.id)); toast.success("Empresa eliminada"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ], []);

  return (
    <AdminPage
      title="Empresas"
      description="Gestión multi-tenant de organizaciones registradas en la plataforma."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Nueva empresa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear empresa</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5"><Label>Nombre</Label><Input placeholder="Distribuidora Norte" /></div>
              <div className="grid gap-1.5"><Label>Dominio</Label><Input placeholder="empresa.cnm.io" /></div>
              <div className="grid gap-1.5"><Label>Correo fiscal</Label><Input placeholder="admin@empresa.com" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label>NIT/RFC</Label><Input /></div><div className="grid gap-1.5"><Label>Teléfono</Label><Input /></div></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { setOpen(false); toast.success("Empresa creada"); }}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable data={data} columns={columns} searchPlaceholder="Buscar empresa…" exportFilename="empresas" />
    </AdminPage>
  );
}
