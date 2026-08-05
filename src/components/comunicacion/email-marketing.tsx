import { Mail, Send, LayoutTemplate, Users, Workflow, Server, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard } from "@/components/common/kpi-card";
import { EmptyState } from "@/components/common/empty-state";
import { useChannelAnalytics } from "@/hooks/use-communication";

const SOON = "Disponible en la siguiente actualización.";

export function EmailMarketing() {
  const { data } = useChannelAnalytics();
  const email = data?.email;

  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" /> Email Marketing
            </CardTitle>
            <CardDescription>
              Arquitectura lista: proveedor SMTP/transaccional pendiente de conexión.
            </CardDescription>
          </div>
          <Badge variant="secondary">{SOON}</Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Enviados" value={String(email?.sent ?? 0)} icon={Send} />
        <KpiCard label="Entregados" value={String(email?.delivered ?? 0)} icon={Mail} tone="success" />
        <KpiCard label="Aperturas" value={String(email?.read ?? 0)} icon={BarChart3} tone="info" />
        <KpiCard label="Fallidos" value={String(email?.failed ?? 0)} icon={Workflow} tone="warning" />

      </div>

      <Tabs defaultValue="campanas">
        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="listas">Listas</TabsTrigger>
          <TabsTrigger value="automatizaciones">Automatizaciones</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campanas">
          <EmptyState icon={Send} title="Sin campañas de email" description={SOON} />
        </TabsContent>
        <TabsContent value="plantillas">
          <EmptyState icon={LayoutTemplate} title="Plantillas de email" description={SOON} />
        </TabsContent>
        <TabsContent value="listas">
          <EmptyState icon={Users} title="Listas y segmentos" description={SOON} />
        </TabsContent>
        <TabsContent value="automatizaciones">
          <EmptyState icon={Workflow} title="Flujos automatizados" description={SOON} />
        </TabsContent>
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4" /> Configuración SMTP
              </CardTitle>
              <CardDescription>{SOON}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Host</Label>
                <Input placeholder="smtp.proveedor.com" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Puerto</Label>
                <Input placeholder="587" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Remitente</Label>
                <Input placeholder="no-reply@empresa.com" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Nombre remitente</Label>
                <Input placeholder="CNM Nova" disabled />
              </div>
              <div className="sm:col-span-2">
                <Button disabled>Probar conexión</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <EmptyState icon={BarChart3} title="Analytics de email" description={SOON} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
