import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultIntegrations, type Integration } from "@/config/admin.config";
import { Plug, Settings } from "lucide-react";
import { toast } from "sonner";

const TONE: Record<Integration["status"], string> = {
  connected: "border-emerald-500/40 text-emerald-600 bg-emerald-500/10",
  disconnected: "border-border text-muted-foreground",
  error: "border-destructive/40 text-destructive bg-destructive/10",
};

export const Route = createFileRoute("/_admin/admin/integraciones" as never)({
  head: () => ({ meta: [{ title: "Integraciones — Super Admin" }] }),
  component: IntPage,
});

function IntPage() {
  const [items, setItems] = useState<Integration[]>(defaultIntegrations);
  return (
    <AdminPage title="Integraciones" description="Conecta proveedores externos: SMS, WhatsApp, email, CRM y analytics.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Plug className="h-5 w-5" /></div>
                <div>
                  <CardTitle className="text-base">{it.name}</CardTitle>
                  <CardDescription className="mt-0.5 capitalize">{it.category}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={TONE[it.status]}>{it.status === "connected" ? "Conectado" : it.status === "error" ? "Error" : "Desconectado"}</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <Switch checked={it.enabled} onCheckedChange={(v) => { setItems((xs) => xs.map((x) => x.id === it.id ? { ...x, enabled: v } : x)); toast.success(v ? `${it.name} habilitado` : `${it.name} deshabilitado`); }} />
              <Button variant="outline" size="sm"><Settings className="mr-1.5 h-4 w-4" />Configurar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPage>
  );
}
