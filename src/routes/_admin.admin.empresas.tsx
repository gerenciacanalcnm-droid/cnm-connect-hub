import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle } from "lucide-react";

import { listCompanies } from "@/lib/platform.functions";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial";
  balance: number;
  usersCount: number;
};

export const Route = createFileRoute("/_admin/admin/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Super Admin" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: async () => {
      const rows = (await listCompanies()) as Array<{
        id: string;
        name: string;
        slug: string;
        status: string;
        balance: number | null;
      }>;
      return rows.map<CompanyRow>((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        status: (r.status as CompanyRow["status"]) ?? "active",
        balance: Number(r.balance ?? 0),
        usersCount: 0,
      }));
    },
  });

  const columns = useMemo<ColumnDef<CompanyRow, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Empresa" },
      { accessorKey: "slug", header: "Slug" },
      {
        accessorKey: "balance",
        header: "Saldo",
        cell: (c) => formatCurrency(c.row.original.balance),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: (c) => <StatusBadge status={c.row.original.status} />,
      },
      {
        id: "actions",
        cell: (c) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={`/admin/empresas/${c.row.original.id}/whatsapp`}>
                <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-500" />
                WhatsApp
              </a>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );


  return (
    <AdminPage
      title="Empresas"
      description="Gestión multi-tenant de organizaciones registradas en la plataforma."
      actions={
        <Button
          size="sm"
          onClick={() => toast.info("Próximamente: creación de empresas desde el panel.")}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva empresa
        </Button>
      }
    >
      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Cargando empresas…</div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          searchPlaceholder="Buscar empresa…"
          exportFilename="empresas"
        />
      )}
    </AdminPage>
  );
}
