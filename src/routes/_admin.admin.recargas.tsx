import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/recargas")({
  head: () => ({ meta: [{ title: "Recargas — Super Admin" }] }),
  component: RecargasPage,
});

function RecargasPage() {
  return (
    <AdminPage title="Recargas" description="Solicitudes de recarga con aprobación manual.">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Próximamente</p>
            <p className="text-xs text-muted-foreground">Las solicitudes de recarga aparecerán aquí cuando el módulo de pagos esté conectado.</p>
          </div>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
