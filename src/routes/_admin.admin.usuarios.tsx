import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { userService } from "@/services/user.service";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — Super Admin" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => userService.list(),
  });

  const columns = useMemo<ColumnDef<(typeof data)[number], unknown>[]>(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "email", header: "Correo" },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: (c) => (
          <div className="flex flex-wrap gap-1">
            {c.row.original.roles.map((r) => (
              <Badge key={r} variant="outline">
                {r}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: (c) => <StatusBadge status={c.row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Registrado",
        cell: (c) => formatDateTime(c.row.original.createdAt),
      },
    ],
    [],
  );

  return (
    <AdminPage
      title="Usuarios"
      description="Gestión centralizada de todas las cuentas de acceso a la plataforma."
      actions={
        <Button
          size="sm"
          onClick={() => toast.info("Próximamente: invitación de usuarios desde el panel.")}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Invitar usuario
        </Button>
      }
    >
      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Cargando usuarios…</div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          searchPlaceholder="Buscar usuario…"
          exportFilename="usuarios"
        />
      )}
    </AdminPage>
  );
}
