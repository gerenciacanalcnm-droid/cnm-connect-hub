import { useMemo } from "react";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { useSms } from "@/hooks/use-sms";
import type { Sms } from "@/types/sms";

export function SmsHistory() {
  const { data, isLoading, error, refetch } = useSms({ pageSize: 100 });
  const rows = data?.items ?? [];

  const columns = useMemo<ColumnDef<Sms>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short",
          }),
      },
      { accessorKey: "to", header: "Destinatario" },
      { accessorKey: "from", header: "Remitente" },
      {
        accessorKey: "message",
        header: "Mensaje",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[420px] text-muted-foreground">
            {row.original.message}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  if (isLoading) return <SkeletonTable rows={8} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <DataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Buscar por número, remitente o texto…"
      exportFilename="historial-sms"
      enableSelection
      emptyTitle="Sin envíos aún"
      emptyDescription="Envía tu primer SMS para empezar a ver el historial."
    />
  );
}
