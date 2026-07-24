import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAdminSms } from "@/hooks/use-admin-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/config-sms")({
  head: () => ({ meta: [{ title: "Configuración SMS — Super Admin" }] }),
  component: ConfigSms,
});

function ConfigSms() {
  const s = useAdminSms();
  return (
    <AdminPage title="Configuración SMS" description="Proveedor, credenciales, límites y horarios de envío." actions={<Button size="sm" onClick={() => toast.success("Guardado")}>Guardar</Button>}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Credenciales</CardTitle><CardDescription>Se cifran en reposo.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5"><Label>Proveedor</Label><Input defaultValue={s.provider} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Usuario</Label><Input defaultValue={s.username} /></div>
              <div className="grid gap-1.5"><Label>Sender</Label><Input defaultValue={s.sender} /></div>
            </div>
            <div className="grid gap-1.5"><Label>API Key</Label><Input type="password" defaultValue={s.apiKey} /></div>
            <div className="grid gap-1.5"><Label>Password</Label><Input type="password" defaultValue={s.password} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Operación</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Timeout (s)</Label><Input type="number" defaultValue={s.timeout} /></div>
              <div className="grid gap-1.5"><Label>Retries</Label><Input type="number" defaultValue={s.retries} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Horario inicio</Label><Input type="time" defaultValue={s.scheduleStart} /></div>
              <div className="grid gap-1.5"><Label>Horario fin</Label><Input type="time" defaultValue={s.scheduleEnd} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Límite diario</Label><Input type="number" defaultValue={s.dailyLimit} /></div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div><p className="text-sm font-medium">Flash SMS</p><p className="text-xs text-muted-foreground">Notificaciones prioritarias sin almacenamiento.</p></div>
              <Switch defaultChecked={s.flashSms} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
