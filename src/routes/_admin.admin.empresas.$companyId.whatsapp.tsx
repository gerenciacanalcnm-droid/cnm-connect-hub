import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/admin-page";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  MessageCircle, 
  Phone, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Wallet,
  Calendar,
  Settings2,
  Clock,
  Layers,
  Activity,
  Star
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  useCompanyWhatsAppProfile, 
  useWhatsAppLimitMutations,
  useWhatsAppConsumptionStats
} from "@/hooks/use-whatsapp-commercial";

export const Route = createFileRoute("/_admin/admin/empresas/$companyId/whatsapp")({
  head: () => ({ meta: [{ title: "Perfil WhatsApp de Empresa — Super Admin" }] }),
  component: CompanyWhatsAppProfilePage,
});

function CompanyWhatsAppProfilePage() {
  const { companyId } = Route.useParams();
  const { data: profile, isLoading } = useCompanyWhatsAppProfile(companyId);
  const { data: consumption } = useWhatsAppConsumptionStats(companyId, 'month');
  const updateLimits = useWhatsAppLimitMutations();

  const [limits, setLimits] = React.useState({
    monthlyLimit: 0,
    dailyLimit: 0,
    hourlyLimit: 0,
    campaignLimit: 0,
    isActive: false
  });

  React.useEffect(() => {
    if (profile?.limits) {
      setLimits({
        monthlyLimit: profile.limits.monthly_limit || 0,
        dailyLimit: profile.limits.daily_limit || 0,
        hourlyLimit: profile.limits.hourly_limit || 0,
        campaignLimit: profile.limits.campaign_limit || 0,
        isActive: !!profile.limits.is_active
      });
    }
  }, [profile]);

  const handleSaveLimits = async () => {
    try {
      await updateLimits.mutateAsync({
        companyId,
        monthlyLimit: limits.monthlyLimit || null,
        dailyLimit: limits.dailyLimit || null,
        hourlyLimit: limits.hourlyLimit || null,
        campaignLimit: limits.campaignLimit || null,
        isActive: limits.isActive
      });
      toast.success("Límites actualizados correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar límites");
    }
  };

  if (isLoading || !profile) {
    return (
      <AdminPage title="WhatsApp Profile" description="Cargando perfil comercial...">
        <div className="flex h-64 items-center justify-center italic text-muted-foreground">
          Obteniendo datos de WhatsApp...
        </div>
      </AdminPage>
    );
  }

  const { stats, company, accounts } = profile;

  return (
    <AdminPage 
      title={`WhatsApp: ${company.name}`}
      description="Control comercial y operativo de mensajería WhatsApp por empresa."
      actions={
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 h-8">
             <Wallet className="h-3.5 w-3.5" />
             Wallet: {formatCurrency(company.balance)}
           </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Enviados</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total histórico acumulado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrega Exitosa</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successful.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sent > 0 ? ((stats.successful / stats.sent) * 100).toFixed(1) : 0}% de efectividad
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Fallidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Errores de API o destinatario</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consumo WhatsApp</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
              <p className="text-xs text-muted-foreground">Costo total incurrido</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuración de Límites */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Límites de Mensajería
                  </CardTitle>
                  <CardDescription>
                    Configura restricciones para evitar consumos excesivos o spam.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="limits-active" className="text-xs">Estado:</Label>
                  <Switch 
                    id="limits-active"
                    checked={limits.isActive}
                    onCheckedChange={(checked) => setLimits(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Badge variant={limits.isActive ? "default" : "secondary"}>
                    {limits.isActive ? "Activo" : "Desactivado"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> Límite Mensual
                  </Label>
                  <Input 
                    type="number" 
                    value={limits.monthlyLimit}
                    onChange={(e) => setLimits(prev => ({ ...prev, monthlyLimit: parseInt(e.target.value) }))}
                    placeholder="Sin límite"
                  />
                  <p className="text-[10px] text-muted-foreground">Capacidad total por mes calendario.</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" /> Límite Diario
                  </Label>
                  <Input 
                    type="number" 
                    value={limits.dailyLimit}
                    onChange={(e) => setLimits(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) }))}
                    placeholder="Sin límite"
                  />
                  <p className="text-[10px] text-muted-foreground">Mensajes permitidos por día (00:00 UTC).</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" /> Límite por Campaña
                  </Label>
                  <Input 
                    type="number" 
                    value={limits.campaignLimit}
                    onChange={(e) => setLimits(prev => ({ ...prev, campaignLimit: parseInt(e.target.value) }))}
                    placeholder="Sin límite"
                  />
                  <p className="text-[10px] text-muted-foreground">Máximo de destinatarios por envío masivo.</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" /> Límite por Hora
                  </Label>
                  <Input 
                    type="number" 
                    value={limits.hourlyLimit}
                    onChange={(e) => setLimits(prev => ({ ...prev, hourlyLimit: parseInt(e.target.value) }))}
                    placeholder="Sin límite"
                  />
                  <p className="text-[10px] text-muted-foreground">Protección contra ráfagas de envío.</p>
                </div>

              </div>
            </CardContent>
            <Separator />
            <div className="p-6 flex justify-end">
              <Button onClick={handleSaveLimits} disabled={updateLimits.isPending}>
                {updateLimits.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Card>

          {/* Resumen de Cuentas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-500" /> Números Asignados
              </CardTitle>
              <CardDescription>
                Cuentas de WhatsApp actualmente bajo control de esta empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.length > 0 ? accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{acc.alias}</span>
                        {acc.isDefault && <StarBadge />}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{acc.phoneNumber || 'N/A'}</span>
                    </div>
                    <Badge variant={acc.novaStatus === 'ASSIGNED' ? "default" : "secondary"} className="text-[9px]">
                      {acc.novaStatus}
                    </Badge>
                  </div>
                )) : (
                  <div className="text-center py-8 text-sm text-muted-foreground italic border-2 border-dashed rounded-lg">
                    No hay números asignados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consumo por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Consumo (Mes Actual)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="types">Por Tipo</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4">
                <div className="flex items-center justify-between text-sm p-3 border rounded-lg">
                  <span className="text-muted-foreground">Total Mensajes en {new Date().toLocaleString('es-ES', { month: 'long' })}</span>
                  <span className="font-bold">{consumption?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 border rounded-lg mt-2 bg-primary/[0.03]">
                  <span className="text-muted-foreground">Costo Proyectado</span>
                  <span className="font-bold text-primary">{formatCurrency(consumption?.cost || 0)}</span>
                </div>
              </TabsContent>
              <TabsContent value="types" className="pt-4 space-y-2">
                {consumption?.byType && Object.entries(consumption.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm p-2 border-b last:border-0 capitalize">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}

function StarBadge() {
  return (
    <Badge variant="secondary" className="h-4 px-1 bg-amber-50 text-amber-600 border-amber-200 text-[9px]">
       Principal
    </Badge>
  );
}
