import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Role = { id: string; name: string; company: string; users: number; permissions: number; system: boolean };

const seed: Role[] = [
  { id: "r1", name: "Super Admin", company: "Global", users: 3, permissions: 42, system: true },
  { id: "r2", name: "Admin Empresa", company: "Todos", users: 128, permissions: 28, system: true },
  { id: "r3", name: "Operador SMS", company: "Todos", users: 240, permissions: 12, system: false },
  { id: "r4", name: "Analista CRM", company: "Retail Prime", users: 18, permissions: 9, system: false },
  { id: "r5", name: "Contabilidad", company: "Todos", users: 44, permissions: 6, system: false },
  { id: "r6", name: "Solo lectura", company: "Todos", users: 96, permissions: 4, system: false },
];

export const Route = createFileRoute("/_admin/admin/roles")({
  head: () => ({ meta: [{ title: "Roles — Super Admin" }] }),
  component: RolesPage,
});

function RolesPage() {
  const [data, setData] = useState<Role[]>(seed);
  const [open, setOpen] = useState(false);
  const columns = useMemo<ColumnDef<Role, unknown>[]>(() => [
    { accessorKey: "name", header: "Rol", cell: (c) => <div className="flex items-center gap-2"><span className="font-medium">{c.row.original.name}</span>{c.row.original.system && <Badge variant="outline" className="text-[10px]">Sistema</Badge>}</div> },
    { accessorKey: "company", header: "Empresa" },
    { accessorKey: "users", header: "Usuarios" },
    { accessorKey: "permissions", header: "Permisos" },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" aria-label="Duplicar" onClick={() => { setData((d) => [...d, { ...row.original, id: `r${Date.now()}`, name: `${row.original.name} (copia)`, system: false }]); toast.success("Rol duplicado"); }}><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
        {!row.original.system && <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => setData((d) => d.filter((x) => x.id !== row.original.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
      </div>
    )},
  ], []);

  return (
    <AdminPage
      title="Roles"
      description="Define roles reutilizables por empresa con conjuntos de permisos."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Nuevo rol</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear rol</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5"><Label>Nombre</Label><Input /></div>
              <div className="grid gap-1.5"><Label>Empresa (opcional)</Label><Input placeholder="Global o específica" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { setOpen(false); toast.success("Rol creado"); }}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable data={data} columns={columns} searchPlaceholder="Buscar rol…" exportFilename="roles" />
    </AdminPage>
  );
}
