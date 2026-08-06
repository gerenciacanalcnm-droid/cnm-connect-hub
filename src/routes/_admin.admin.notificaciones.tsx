import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAdminNotifications } from "@/hooks/use-admin-settings";
import { Mail, Bell as BellIcon, Smartphone, MessageCircle, Monitor } from "lucide-react";
import { toast } from "sonner";

const ROWS = [
  {
    k: "email",
    label: "Correo",
    icon: Mail,
    description: "Notificaciones transaccionales y resúmenes.",
  },
  {
    k: "push",
    label: "Push",
    icon: BellIcon,
    description: "Notificaciones push del navegador y móvil.",
  },
  {
    k: "inApp",
    label: "En plataforma",
    icon: Monitor,
    description: "Bandeja de notificaciones dentro del panel.",
  },
  { k: "sms", label: "SMS", icon: Smartphone, description: "Alertas críticas por SMS al equipo." },
  {
    k: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    description: "Alertas por WhatsApp cuando esté activo.",
  },
] as const;

export const Route = createFileRoute("/_admin/admin/notificaciones")({
  head: () => ({ meta: [{ title: "Notificaciones — Super Admin" }] }),
  component: NotifPage,
});

function NotifPage() {
  const n = useAdminNotifications();
  return (
    <AdminPage
      title="Notificaciones"
      description="Canales de comunicación con administradores y clientes."
      actions={
        <Button size="sm" onClick={() => toast.success("Guardado")}>
          Guardar
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Canales</CardTitle>
          <CardDescription>Activa qué canales usa la plataforma para notificar.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {ROWS.map(({ k, label, icon: Icon, description }) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-muted">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch defaultChecked={n[k as keyof typeof n]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminPage>
  );
}
