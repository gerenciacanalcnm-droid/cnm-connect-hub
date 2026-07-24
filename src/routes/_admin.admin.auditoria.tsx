import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/auditoria")({
  head: () => ({ meta: [{ title: "Auditoría — Super Admin" }] }),
  component: AuditoriaPage,
});

function AuditoriaPage() {
  return (
    <AdminPage title="Auditoría" description="Timeline inmutable de acciones críticas en la plataforma.">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Próximamente</p>
            <p className="text-xs text-muted-foreground">La auditoría se poblará cuando las acciones sensibles se registren en la base de datos.</p>
          </div>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
