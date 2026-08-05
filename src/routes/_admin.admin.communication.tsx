import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAdminSms } from "@/hooks/use-admin-settings";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCommunicationProviders } from "@/hooks/use-communication";
import { useCompany } from "@/hooks/use-company";

export const Route = createFileRoute("/_admin/admin/communication")({
  head: () => ({ meta: [{ title: "Communication — Super Admin" }] }),
  component: CommPage,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label className="text-xs font-medium">{label}</Label>{children}</div>;
}

function CommPage() {
  const s = useAdminSms();
  const providers = useCommunicationProviders();
  const { data: company } = useCompany();
  const companyName = company?.name ?? "Todas";
  return (
    <AdminPage
      title="Communication"
      description="Configuración general de los canales de mensajería SMS y WhatsApp."
      actions={<Button size="sm" onClick={() => toast.success("Configuración guardada")}>Guardar</Button>}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Proveedor SMS</CardTitle><CardDescription>Balance, límites y horarios operativos.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Proveedor"><Input defaultValue={s.provider} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Timeout (s)"><Input type="number" defaultValue={s.timeout} /></Field>
              <Field label="Reintentos"><Input type="number" defaultValue={s.retries} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Compra mínima"><Input type="number" defaultValue={1000} /></Field>
              <Field label="Límite diario"><Input type="number" defaultValue={s.dailyLimit} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horario inicio"><Input type="time" defaultValue={s.scheduleStart} /></Field>
              <Field label="Horario fin"><Input type="time" defaultValue={s.scheduleEnd} /></Field>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div><p className="text-sm font-medium">Flash SMS</p><p className="text-xs text-muted-foreground">Enviar en modo Flash cuando aplique.</p></div>
              <Switch defaultChecked={s.flashSms} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Proveedor WhatsApp</CardTitle><CardDescription>Integración con Meta Cloud API.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Business Account ID"><Input placeholder="123456789" /></Field>
            <Field label="Phone Number ID"><Input placeholder="123456789" /></Field>
            <Field label="Número"><Input placeholder="+57 300 000 0000" /></Field>
            <Field label="Webhook"><Input placeholder="https://api.smscnm.com/wa/hook" /></Field>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div><p className="text-sm font-medium">Activar canal</p><p className="text-xs text-muted-foreground">Habilitar envío por WhatsApp.</p></div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Communication Providers</CardTitle>
          <CardDescription>
            Registro global de proveedores por canal. La conexión real se habilita por integración oficial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Conectado</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead className="text-right">Logs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.channel}>
                  <TableCell className="font-medium uppercase">{p.channel}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{companyName}</TableCell>
                  <TableCell>
                    <Badge variant={p.ready ? "default" : "secondary"}>
                      {p.ready ? "Activo" : "Preparado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.ready ? "Sí" : "No"}</TableCell>
                  <TableCell>v1</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" disabled>Ver logs</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Disponible en la siguiente actualización.
          </p>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
