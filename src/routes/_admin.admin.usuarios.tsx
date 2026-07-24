import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, KeyRound, Lock, Unlock } from "lucide-react";
import { generateAdminUsers, type AdminUser } from "@/services/mocks/admin.mock";
import { formatRelativeTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — Super Admin" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const [data, setData] = useState<AdminUser[]>(() => generateAdminUsers());
  const [open, setOpen] = useState(false);

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(() => [
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "email", header: "Correo" },
    { accessorKey: "company", header: "Empresa" },
    { accessorKey: "role", header: "Rol", cell: (c) => <Badge variant="outline">{c.row.original.role}</Badge> },
    { accessorKey: "status", header: "Estado", cell: (c) => <StatusBadge status={c.row.original.status} /> },
    { accessorKey: "google", header: "Google", cell: (c) => c.row.original.google ? <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">Sí</Badge> : <span className="text-muted-foreground">—</span> },
    { accessorKey: "lastLogin", header: "Último acceso", cell: (c) => formatRelativeTime(c.row.original.lastLogin) },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Reset password" onClick={() => toast.success("Enlace de restablecimiento enviado")}><KeyRound className="h-4 w-4" /></Button>
          {row.original.status === "suspended" ? (
            <Button variant="ghost" size="icon" aria-label="Desbloquear" onClick={() => { setData((d) => d.map((x) => x.id === row.original.id ? { ...x, status: "active" } : x)); toast.success("Usuario desbloqueado"); }}><Unlock className="h-4 w-4" /></Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Bloquear" onClick={() => { setData((d) => d.map((x) => x.id === row.original.id ? { ...x, status: "suspended" } : x)); toast.success("Usuario bloqueado"); }}><Lock className="h-4 w-4" /></Button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <AdminPage
      title="Usuarios"
      description="Gestión centralizada de todas las cuentas de acceso a la plataforma."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Invitar usuario</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invitar usuario</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5"><Label>Nombre</Label><Input /></div>
              <div className="grid gap-1.5"><Label>Correo</Label><Input type="email" /></div>
              <div className="grid gap-1.5"><Label>Empresa</Label><Input /></div>
              <div className="grid gap-1.5"><Label>Rol</Label><Input placeholder="Admin, Operador…" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { setOpen(false); toast.success("Invitación enviada"); }}>Enviar invitación</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable data={data} columns={columns} searchPlaceholder="Buscar usuario…" exportFilename="usuarios" />
    </AdminPage>
  );
}
