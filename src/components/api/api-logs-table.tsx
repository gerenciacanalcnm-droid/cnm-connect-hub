import { useMemo } from "react";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { Badge } from "@/components/ui/badge";
import { useApiLogs } from "@/hooks/use-api-keys";
import type { ApiLog } from "@/types/api-key";
import { cn } from "@/lib/utils";

const methodColor: Record<ApiLog["method"], string> = {
  GET: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  POST: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function ApiLogsTable() {
  const { data, isLoading, error, refetch } = useApiLogs();

  const columns = useMemo<ColumnDef<ApiLog>[]>(
    () => [
      {
        accessorKey: "method",
        header: "Método",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("font-mono text-[10px]", methodColor[row.original.method])}
          >
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "path",
        header: "Path",
        cell: ({ row }) => <code className="font-mono text-xs">{row.original.path}</code>,
      },
      {
        accessorKey: "statusCode",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.statusCode;
          const tone = s < 300 ? "text-emerald-600" : s < 400 ? "text-amber-600" : "text-red-600";
          return <span className={cn("font-mono font-semibold", tone)}>{s}</span>;
        },
      },
      {
        accessorKey: "latencyMs",
        header: "Latencia",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.latencyMs} ms</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Hora",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleTimeString("es-MX"),
      },
    ],
    [],
  );

  if (isLoading) return <SkeletonTable rows={10} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return <DataTable data={data ?? []} columns={columns} />;
}
