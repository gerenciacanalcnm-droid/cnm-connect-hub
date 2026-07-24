import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { settingsConfig, type FeatureKey } from "@/config/settings.config";
import { toast } from "sonner";
import { MessageSquare, Users, MessageCircle, BarChart3, Sparkles, Code2, Wallet, LifeBuoy, FileText, Zap, type LucideIcon, Flag } from "lucide-react";

const META: Record<string, { icon: LucideIcon; label: string; description: string }> = {
  landing: { icon: FileText, label: "Landing", description: "Sitio público de marketing." },
  crm: { icon: Users, label: "CRM", description: "Contactos, segmentos, pipeline." },
  sms: { icon: MessageSquare, label: "SMS", description: "Motor de envío de SMS." },
  flashSms: { icon: Zap, label: "Flash SMS", description: "SMS prioritarios sin almacenamiento." },
  campaigns: { icon: MessageSquare, label: "Campañas", description: "Campañas masivas y programadas." },
  analytics: { icon: BarChart3, label: "Analytics", description: "Dashboards y reportes." },
  api: { icon: Code2, label: "API", description: "Acceso programático." },
  cnmNova: { icon: Sparkles, label: "CNM Nova", description: "Copiloto IA integrado." },
  automations: { icon: Zap, label: "Automatizaciones", description: "Flujos y disparadores." },
  affiliates: { icon: Users, label: "Afiliados", description: "Programa de referidos." },
  distributors: { icon: Users, label: "Distribuidores", description: "Red de reventa." },
  billing: { icon: Wallet, label: "Facturación", description: "Facturas y recargas." },
  support: { icon: LifeBuoy, label: "Soporte", description: "Tickets y helpdesk." },
};

export const Route = createFileRoute("/_admin/admin/feature-flags")({
  head: () => ({ meta: [{ title: "Feature Flags — Super Admin" }] }),
  component: FeatureFlagsPage,
});

function FeatureFlagsPage() {
  const [flags, setFlags] = useState(settingsConfig.features);
  const total = Object.values(flags).length;
  const enabled = Object.values(flags).filter(Boolean).length;

  return (
    <AdminPage
      title="Feature Flags"
      description="Activa o desactiva módulos globales sin desplegar código."
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary"><Flag className="mr-1 h-3 w-3" />{enabled}/{total} activos</Badge>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(flags) as FeatureKey[]).map((k) => {
          const m = META[k] ?? { icon: Flag, label: k, description: "" };
          const Icon = m.icon;
          return (
            <Card key={k}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <div>
                    <CardTitle className="text-base">{m.label}</CardTitle>
                    <CardDescription className="mt-0.5">{m.description}</CardDescription>
                  </div>
                </div>
                <Switch checked={flags[k]} onCheckedChange={(v) => { setFlags((f) => ({ ...f, [k]: v })); toast.success(`${m.label}: ${v ? "activado" : "desactivado"}`); }} />
              </CardHeader>
            </Card>
          );
        })}
      </div>
      <div className="flex justify-end"><Button size="sm" onClick={() => toast.success("Flags publicados")}>Publicar cambios</Button></div>
    </AdminPage>
  );
}
