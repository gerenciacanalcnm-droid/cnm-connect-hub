import { Settings2, MessageSquare, MessageCircle, Mail, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/loader";
import { useCommunicationSettings, useCommunicationProviders } from "@/hooks/use-communication";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { testMetaConnection } from "@/lib/whatsapp-diagnostic.functions";
import { getMetaTemplatesDetail } from "@/lib/whatsapp-diagnostic-detail.functions";
import { syncWhatsAppTemplates } from "@/lib/whatsapp.functions";
import { supabase } from "@/integrations/supabase/client";

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
  const [detail, setDetail] = useState<any>(null);
  const runDiagnostic = useServerFn(testMetaConnection);
  const runDetail = useServerFn(getMetaTemplatesDetail);
  const syncTemplates = useServerFn(syncWhatsAppTemplates);
  const [syncing, setSyncing] = useState(false);

  const handleDiagnostic = async () => {
    setTesting(true);
    setDiagnostic(null);
    setDetail(null);
    try {
      const res = await runDiagnostic();
      setDiagnostic(res);
      
      // Si falla cnm_prueba, lanzamos el detalle automáticamente
      if (res && 'CNM_PRUEBA' in res && res.CNM_PRUEBA === "NO ENCONTRADA") {
        const detailRes = await runDetail();
        setDetail(detailRes);
      }

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

  const handleSyncTemplates = async () => {
    setSyncing(true);
    try {
      // 1. Get the current active WhatsApp account ID for this company
      const { data: accounts } = await supabase
        .from("whatsapp_accounts")
        .select("id")
        .eq("status", "connected")
        .limit(1);

      if (accounts && accounts.length > 0) {
        await syncTemplates({ data: { accountId: accounts[0].id } });
        toast.success("Plantillas sincronizadas exitosamente");
      } else {
        toast.error("No hay una cuenta de WhatsApp conectada para sincronizar");
      }
    } catch (e) {
      toast.error("Error al sincronizar plantillas");
    } finally {
      setSyncing(false);
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

              {detail && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Activity className="h-3 w-3" /> Reporte Técnico de Meta
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1 text-slate-400 hover:text-white"
                      onClick={handleSyncTemplates}
                      disabled={syncing}
                    >
                      <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                      Sincronizar plantillas
                    </Button>
                  </div>
                  
                  <div className="grid gap-2 text-[11px] font-mono bg-slate-950 text-slate-300 p-3 rounded-md overflow-x-auto">
                    <p className="text-blue-400">// Configuración</p>
                    <p>WABA configurado: {detail.config?.businessAccountId}</p>
                    <p>Phone Number ID: {detail.config?.phoneNumberId}</p>
                    
                    <p className="text-blue-400 mt-2">// Propiedad WABA</p>
                    <p>WABA real del Phone Number: {detail.phone_details?.whatsapp_business_account?.id || 'NO ENCONTRADO'}</p>
                    <p>Número: {detail.phone_details?.display_phone_number || 'N/A'}</p>
                    <p>Estado: {detail.phone_details?.status || 'N/A'}</p>
                    <p>Calificación: {detail.phone_details?.quality_rating || 'N/A'}</p>
                    <p>¿Phone pertenece al WABA?: {
                      detail.waba_phone_numbers?.some((p: any) => p.id === detail.config?.phoneNumberId) ? 'SÍ' : 'NO (ERROR CRÍTICO)'
                    }</p>

                    <p className="text-blue-400 mt-2">// Plantillas ({detail.templates?.length || 0})</p>
                    {detail.cnm_prueba_match ? (
                      <div className="bg-green-500/10 p-1 rounded border border-green-500/20 text-green-400">
                        Plantilla encontrada:
                        <br/>Name: {detail.cnm_prueba_match.name}
                        <br/>Lang: {detail.cnm_prueba_match.language}
                        <br/>Status: {detail.cnm_prueba_match.status}
                        <br/>Category: {detail.cnm_prueba_match.category}
                      </div>
                    ) : (
                      <p className="text-red-400">
                        {detail.phone_details?.whatsapp_business_account?.id === detail.config?.businessAccountId 
                          ? "La conexión es correcta. La plantilla cnm_prueba no existe en este WABA o no está disponible para este token."
                          : "La plantilla no pertenece al WABA consultado o el token no tiene acceso a ese WABA."}
                      </p>
                    )}

                    <div className="mt-2 text-[10px] text-slate-500">
                      Total de plantillas: {detail.templates?.length || 0}
                      <br/>Lista de nombres: {detail.templates?.map((t: any) => `${t.name} (ID: ${t.id}, ${t.status})`).join(', ')}
                    </div>

                  </div>
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

