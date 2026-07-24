import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { adminConfig } from "@/config/admin.config";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/config-api" as never)({
  head: () => ({ meta: [{ title: "API — Super Admin" }] }),
  component: ConfigApi,
});

function ConfigApi() {
  const a = adminConfig.api;
  return (
    <AdminPage title="API" description="Rate limits, TTLs y allowlist. La documentación pública se administra en el módulo API del panel de usuario." actions={<Button size="sm" onClick={() => toast.success("Guardado")}>Guardar</Button>}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Rate limiting</CardTitle><CardDescription>Aplicado por API key.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Requests / min</Label><Input type="number" defaultValue={a.rateLimit} /></div>
              <div className="grid gap-1.5"><Label>Burst</Label><Input type="number" defaultValue={a.burst} /></div>
            </div>
            <div className="grid gap-1.5"><Label>TTL de token (días)</Label><Input type="number" defaultValue={a.tokenTtlDays} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>IP Allowlist</CardTitle><CardDescription>Restringe API por dirección IP.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5"><Label>IPs permitidas (separadas por coma)</Label><Input placeholder="190.145.10.22, 181.49.55.130" /></div>
            <p className="text-xs text-muted-foreground">Vacío = permitir todas las IPs.</p>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
