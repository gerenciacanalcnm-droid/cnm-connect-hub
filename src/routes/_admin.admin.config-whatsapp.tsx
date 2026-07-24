import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/config-whatsapp")({
  head: () => ({ meta: [{ title: "Configuración WhatsApp — Super Admin" }] }),
  component: ConfigWa,
});

function ConfigWa() {
  return (
    <AdminPage
      title="Configuración WhatsApp"
      description="Meta Cloud API. Arquitectura preparada, activación diferida."
      actions={<Button size="sm" onClick={() => toast.success("Guardado")}>Guardar</Button>}
    >
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <MessageCircle className="h-5 w-5 text-amber-600" />
          <div>
            <CardTitle className="text-base">Canal en preparación</CardTitle>
            <CardDescription>La UI está lista. La activación se hará cuando el número esté verificado por Meta.</CardDescription>
          </div>
          <Badge className="ml-auto" variant="outline">Pronto</Badge>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader><CardTitle>Meta Business</CardTitle></CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          <div className="grid gap-1.5"><Label>Business Account ID</Label><Input placeholder="1234567890" /></div>
          <div className="grid gap-1.5"><Label>Phone Number ID</Label><Input placeholder="1234567890" /></div>
          <div className="grid gap-1.5"><Label>Número</Label><Input placeholder="+57 300 000 0000" /></div>
          <div className="grid gap-1.5"><Label>Token</Label><Input type="password" /></div>
          <div className="grid gap-1.5 lg:col-span-2"><Label>Webhook URL</Label><Input placeholder="https://api.smscnm.com/wa/webhook" /></div>
          <div className="grid gap-1.5 lg:col-span-2"><Label>Verify Token</Label><Input placeholder="cnm_wa_verify" /></div>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
