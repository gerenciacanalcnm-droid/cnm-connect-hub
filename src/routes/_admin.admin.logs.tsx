import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/logs")({
  head: () => ({ meta: [{ title: "Logs — Super Admin" }] }),
  component: LogsPage,
});

function LogsPage() {
  return (
    <AdminPage title="Logs del sistema" description="Trazabilidad de eventos por canal y severidad.">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Próximamente</p>
            <p className="text-xs text-muted-foreground">Los logs del sistema se listarán aquí cuando el pipeline de eventos esté activo.</p>
          </div>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
