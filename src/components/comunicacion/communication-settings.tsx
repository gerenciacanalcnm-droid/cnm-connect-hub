import { Settings2, MessageSquare, MessageCircle, Mail, Activity, RefreshCw, Plus, Trash2, Smartphone, CheckCircle2, XCircle } from "lucide-react";
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
import { useWhatsAppAccounts, useDeleteWhatsAppAccount, useSaveWhatsAppAccount, useTestSpecificWhatsAppConnection, useSyncWhatsAppTemplates } from "@/hooks/use-whatsapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const { data: accounts = [], isLoading: accountsLoading } = useWhatsAppAccounts();
  const providers = useCommunicationProviders();
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  
  const testSpecificConnection = useTestSpecificWhatsAppConnection();
  const deleteAccount = useDeleteWhatsAppAccount();
  const syncTemplates = useSyncWhatsAppTemplates();
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  const handleDiagnostic = async (accountId: string) => {
    setTestingAccountId(accountId);
    setDiagnostic(null);
    setDetail(null);
    try {
      const res = await testSpecificConnection.mutateAsync(accountId);
      setDiagnostic(res.basic);
      setDetail(res.detailed);
    } catch (e: any) {
      toast.error(e.message || "Error al ejecutar diagnóstico");
    } finally {
      setTestingAccountId(null);
    }
  };

  const handleSyncTemplates = async (accountId: string) => {
    setSyncingAccountId(accountId);
    try {
      await syncTemplates.mutateAsync(accountId);
      toast.success("Plantillas sincronizadas exitosamente");
    } catch (e) {
      toast.error("Error al sincronizar plantillas");
    } finally {
      setSyncingAccountId(null);
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp Business
            </CardTitle>
            <CardDescription>
              Gestiona tus números y cuentas de WhatsApp Business conectadas.
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conectar Cuenta de WhatsApp</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="alias">Nombre / Alias</Label>
                  <Input id="alias" placeholder="Ej: Ventas Principal" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="token">Access Token (Meta Cloud)</Label>
                  <Input id="token" type="password" placeholder="EAAB..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="waba_id">WhatsApp Business Account ID</Label>
                  <Input id="waba_id" placeholder="1098..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone_id">Phone Number ID</Label>
                  <Input id="phone_id" placeholder="1018..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="mr-auto text-slate-400">Próximamente Integración Meta Embedded</Button>
                <Button disabled>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="flex justify-center p-8"><Loader /></div>
          ) : accounts.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">No hay cuentas de WhatsApp conectadas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.alias}</span>
                        {account.isPrimary && <Badge variant="secondary" className="text-[10px]">Principal</Badge>}
                        <Badge variant={account.status === 'connected' ? "default" : "destructive"} className="text-[10px] capitalize">
                          {account.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {account.displayPhone || account.phoneNumberId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDiagnostic(account.id)}
                      disabled={testingAccountId === account.id}
                      className="h-8 text-xs gap-2"
                    >
                      {testingAccountId === account.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                      Diagnóstico
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSyncTemplates(account.id)}
                      disabled={syncingAccountId === account.id}
                      className="h-8 w-8 p-0"
                      title="Sincronizar Plantillas"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncingAccountId === account.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAccount.mutate(account.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(diagnostic || detail) && (
        <Card className="border-blue-500/20 bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> Reporte Técnico de Meta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnostic && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 rounded-lg border bg-white shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Phone Status</p>
                  <div className="flex items-center gap-2">
                    {diagnostic.PHONE_NUMBER === "OK" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-xs font-medium">{diagnostic.PHONE_NUMBER === "OK" ? "Encontrado" : "Error"}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-white shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">WABA Access</p>
                  <div className="flex items-center gap-2">
                    {diagnostic.WABA === "OK" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-xs font-medium">{diagnostic.WABA === "OK" ? "Conectado" : "Error"}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-white shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Relationship</p>
                  <div className="flex items-center gap-2">
                    {detail?.waba_phone_numbers?.some((p: any) => p.id === detail.config?.phoneNumberId) ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-xs font-medium">{detail?.waba_phone_numbers?.some((p: any) => p.id === detail.config?.phoneNumberId) ? "Vínculo OK" : "Desvinculado"}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-white shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Templates</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{detail?.templates?.length || 0} cargadas</Badge>
                  </div>
                </div>
              </div>
            )}

            {detail && (
              <div className="grid gap-2 text-[11px] font-mono bg-slate-950 text-slate-300 p-4 rounded-md overflow-x-auto border border-slate-800">
                <p className="text-blue-400">// Detalles Meta Cloud</p>
                <p>Display Name: {detail.phone_details?.verified_name || 'N/A'}</p>
                <p>Number ID: {detail.config?.phoneNumberId}</p>
                <p>Number Quality: {detail.phone_details?.quality_rating || 'N/A'}</p>
                <p>Status: {detail.phone_details?.status || 'N/A'}</p>
                
                <p className="text-blue-400 mt-2">// Posesión</p>
                <p>WABA Actual: {detail.phone_details?.whatsapp_business_account?.id || 'NO ENCONTRADO'}</p>
                
                <p className="text-blue-400 mt-2">// Auditoría Plantilla Prueba</p>
                {detail.cnm_prueba_match ? (
                  <p className="text-green-400">Plantilla cnm_prueba: OK (Lang: {detail.cnm_prueba_match.language}, Status: {detail.cnm_prueba_match.status})</p>
                ) : (
                  <p className="text-amber-400">cnm_prueba: No encontrada en este WABA.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    </div>
  );
}

