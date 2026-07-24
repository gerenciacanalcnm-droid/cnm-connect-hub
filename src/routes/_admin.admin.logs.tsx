import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateLogs, type LogEntry } from "@/services/mocks/admin.mock";
import { formatDateTime } from "@/lib/format";

const LEVEL_TONE: Record<LogEntry["level"], string> = {
  info: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  error: "bg-destructive/15 text-destructive",
  debug: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/_admin/admin/logs")({
  head: () => ({ meta: [{ title: "Logs — Super Admin" }] }),
  component: LogsPage,
});

function LogsPage() {
  const all = useMemo(() => generateLogs(120), []);
  const [channel, setChannel] = useState("all");
  const [level, setLevel] = useState("all");
  const data = all.filter((l) => (channel === "all" || l.channel === channel) && (level === "all" || l.level === level));
  const columns = useMemo<ColumnDef<LogEntry, unknown>[]>(() => [
    { accessorKey: "at", header: "Fecha", cell: (c) => formatDateTime(c.row.original.at) },
    { accessorKey: "level", header: "Nivel", cell: (c) => <Badge className={LEVEL_TONE[c.row.original.level]}>{c.row.original.level.toUpperCase()}</Badge> },
    { accessorKey: "channel", header: "Canal", cell: (c) => <Badge variant="outline">{c.row.original.channel}</Badge> },
    { accessorKey: "message", header: "Mensaje" },
  ], []);

  return (
    <AdminPage
      title="Logs del sistema"
      description="Trazabilidad de eventos por canal y severidad."
      actions={
        <div className="flex gap-2">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los canales</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <DataTable data={data} columns={columns} searchPlaceholder="Buscar mensaje…" exportFilename="logs" pageSize={25} />
    </AdminPage>
  );
}
