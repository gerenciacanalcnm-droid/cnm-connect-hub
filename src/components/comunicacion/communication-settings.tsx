import { Settings2, MessageSquare, MessageCircle, Mail, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/loader";
import { useCommunicationSettings, useCommunicationProviders } from "@/hooks/use-communication";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { testMetaConnection, getMetaTemplatesDetail } from "@/lib/whatsapp-diagnostic.functions"; // I will merge them or fix import
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const SOON = "Disponible en la siguiente actualización.";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

const ICONS: Record<string, typeof MessageSquare> = {
  sms: MessageSquare,
  whatsapp: MessageCircle,
  email: Mail,
};

export function CommunicationSettings() {
  const { data: settings, isLoading } = useCommunicationSettings();
  const providers = useCommunicationProviders();
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const runDiagnostic = useServerFn(testMetaConnection);

  const handleDiagnostic = async () => {
    setTesting(true);
    setDiagnostic(null);
    try {
      const res = await runDiagnostic();
      setDiagnostic(res);
      if (res && 'PHONE_NUMBER' in res && res.PHONE_NUMBER === "OK" && res.WABA === "OK" && res.TEMPLATES === "OK") {
        toast.success("Conexión con Meta verificada");
      } else {
        toast.warning("La conexión con Meta tiene errores");
      }
    } catch (e) {
      toast.error("Error al ejecutar diagnóstico");
    } finally {
      setTesting(false);
    }
  };


  if (isLoading || !settings) return <Loader />;


  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {providers.map((p) => {
          const Icon = ICONS[p.channel] ?? Settings2;
          return (
            <Card key={p.channel}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm capitalize">
                  <Icon className="h-4 w-4" /> {p.channel}
                </CardTitle>
                <Badge variant={p.ready ? "default" : "secondary"}>
                  {p.ready ? "Conectado" : "Pendiente"}
                </Badge>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{p.name}</CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" /> Communication Settings
          </CardTitle>
          <CardDescription>
            Parámetros operativos compartidos por todos los canales. {SOON}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Proveedor SMS">
            <Input defaultValue={settings.smsProvider} disabled />
          </Field>
          <Field label="Proveedor WhatsApp">
            <Input defaultValue={settings.whatsappProvider} disabled />
          </Field>
          <Field label="Proveedor Email">
            <Input defaultValue={settings.emailProvider} disabled />
          </Field>
          <Field label="Horario inicio">
            <Input type="time" defaultValue={settings.scheduleStart} disabled />
          </Field>
          <Field label="Horario fin">
            <Input type="time" defaultValue={settings.scheduleEnd} disabled />
          </Field>
          <Field label="Rate limit (msg/min)">
            <Input type="number" defaultValue={settings.rateLimitPerMinute} disabled />
          </Field>
          <Field label="Timeout (s)">
            <Input type="number" defaultValue={settings.timeoutSeconds} disabled />
          </Field>
          <Field label="Reintentos">
            <Input type="number" defaultValue={settings.retries} disabled />
          </Field>
          <Field label="Firma">
            <Input defaultValue={settings.signature} disabled />
          </Field>
          <Field label="Plantilla por defecto">
            <Input defaultValue={settings.defaultTemplateId ?? ""} placeholder="—" disabled />
          </Field>
          <div className="flex items-end">
            <Button disabled>Guardar cambios</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-500" /> Diagnóstico Meta Cloud
            </CardTitle>
            <CardDescription>
              Verifica la conexión real con los Secrets configurados en Lovable Cloud.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDiagnostic}
            disabled={testing}
            className="gap-2"
          >
            {testing ? "Probando..." : "Ejecutar Prueba"}
          </Button>
        </CardHeader>
        <CardContent>
          {diagnostic && (
            <div className="space-y-4">
              {'success' in diagnostic && diagnostic.success === false ? (
                <Alert variant="destructive">
                  <AlertTitle>Error de Configuración</AlertTitle>
                  <AlertDescription>{diagnostic.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Phone Number</p>
                    <Badge variant={diagnostic.PHONE_NUMBER === "OK" ? "default" : "destructive"}>
                      {diagnostic.PHONE_NUMBER}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">WABA Account</p>
                    <Badge variant={diagnostic.WABA === "OK" ? "default" : "destructive"}>
                      {diagnostic.WABA}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Templates API</p>
                    <Badge variant={diagnostic.TEMPLATES === "OK" ? "default" : "destructive"}>
                      {diagnostic.TEMPLATES}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CNM_PRUEBA</p>
                    <Badge variant={diagnostic.CNM_PRUEBA === "ENCONTRADA" ? "default" : "secondary"}>
                      {diagnostic.CNM_PRUEBA}
                    </Badge>
                  </div>
                </div>
              )}

              {diagnostic.raw_errors && diagnostic.raw_errors.length > 0 && (
                <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <p className="text-xs font-bold text-destructive mb-2">Detalles de errores:</p>
                  <ul className="text-[11px] list-disc pl-4 space-y-1 text-destructive/80 font-mono">
                    {diagnostic.raw_errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!diagnostic && !testing && (
            <p className="text-sm text-muted-foreground italic">
              Haz clic en "Ejecutar Prueba" para validar la conectividad con Meta.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

