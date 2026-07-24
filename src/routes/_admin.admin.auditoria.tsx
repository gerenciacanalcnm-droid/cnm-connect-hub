import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { generateAuditEntries, type AuditEntry } from "@/services/mocks/admin.mock";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/auditoria")({
  head: () => ({ meta: [{ title: "Auditoría — Super Admin" }] }),
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const data = useMemo(() => generateAuditEntries(80), []);
  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(() => [
    { accessorKey: "at", header: "Fecha", cell: (c) => formatDateTime(c.row.original.at) },
    { accessorKey: "user", header: "Usuario" },
    { accessorKey: "company", header: "Empresa" },
    { accessorKey: "action", header: "Acción", cell: (c) => <Badge variant="outline">{c.row.original.action}</Badge> },
    { accessorKey: "entity", header: "Entidad" },
    { accessorKey: "ip", header: "IP", cell: (c) => <code className="text-xs">{c.row.original.ip}</code> },
  ], []);

  return (
    <AdminPage title="Auditoría" description="Timeline inmutable de acciones críticas en la plataforma.">
      <DataTable data={data} columns={columns} searchPlaceholder="Buscar por usuario, empresa o acción…" exportFilename="auditoria" pageSize={20} />
    </AdminPage>
  );
}
