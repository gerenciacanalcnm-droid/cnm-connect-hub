import { MessageCircle, Link2, Pencil, Unplug, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/common/loader";
import { useWhatsAppAccounts } from "@/hooks/use-whatsapp";
import { DEPARTMENT_LABEL } from "@/types/communication";

const SOON = "Disponible en la siguiente actualización.";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

/** Configuración → Canales → WhatsApp Business (Meta Ready, sin conexión real). */
export function WhatsAppChannelConfig() {
  const { data: accounts = [], isLoading } = useWhatsAppAccounts();

  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" /> WhatsApp Business
            </CardTitle>
            <CardDescription>
              La conexión oficial con Meta completará automáticamente Business Manager, Phone Number
              ID y tokens. Nunca se solicitarán manualmente.
            </CardDescription>
          </div>
          <Badge variant="secondary">{SOON}</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button className="gap-1.5" disabled>
            <Link2 className="h-4 w-4" /> Conectar con Meta
          </Button>
          <Button variant="outline" className="gap-1.5" disabled>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button variant="outline" className="gap-1.5" disabled>
            <Activity className="h-4 w-4" /> Probar conexión
          </Button>
          <Button variant="destructive" className="gap-1.5" disabled>
            <Unplug className="h-4 w-4" /> Desconectar
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader />
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay números registrados. Agrégalos desde Communication Hub → WhatsApp.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{a.alias}</CardTitle>
                  <CardDescription>{DEPARTMENT_LABEL[a.department]}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {a.isPrimary && <Badge>Principal</Badge>}
                  <Badge variant="outline">{a.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Row label="Proveedor" value={a.provider} />
                <Separator />
                <Row label="Número" value={a.displayPhone ?? "—"} />
                <Separator />
                <Row label="Business Manager" value={a.businessAccountId ?? "Pendiente de Meta"} />
                <Separator />
                <Row label="Phone Number ID" value={a.phoneNumberId ?? "Pendiente de Meta"} />
                <Separator />
                <Row label="Webhook" value={a.webhookUrl ?? "Pendiente de Meta"} />
                <Separator />
                <Row
                  label="Última sincronización"
                  value={
                    a.lastSyncedAt ? new Date(a.lastSyncedAt).toLocaleString("es-CO") : "Nunca"
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
