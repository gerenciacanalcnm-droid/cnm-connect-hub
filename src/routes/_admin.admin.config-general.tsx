import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAdminGeneral } from "@/hooks/use-admin-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/config-general")({
  head: () => ({ meta: [{ title: "Configuración General — Super Admin" }] }),
  component: ConfigGeneral,
});

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ConfigGeneral() {
  const g = useAdminGeneral();
  return (
    <AdminPage
      title="Configuración General"
      description="Identidad, contacto, localización y parámetros globales."
      actions={
        <Button size="sm" onClick={() => toast.success("Guardado")}>
          Guardar
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identidad</CardTitle>
            <CardDescription>Marca, logotipo y favicon.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <F label="Nombre de la empresa">
              <Input defaultValue={g.companyName} />
            </F>
            <F label="Logo (URL)">
              <Input defaultValue={g.logoUrl} />
            </F>
            <F label="Favicon (URL)">
              <Input defaultValue={g.faviconUrl} />
            </F>
            <div className="grid grid-cols-3 gap-3">
              <F label="Color primario">
                <Input type="color" defaultValue="#6366f1" />
              </F>
              <F label="Acento">
                <Input type="color" defaultValue="#8b5cf6" />
              </F>
              <F label="Éxito">
                <Input type="color" defaultValue="#10b981" />
              </F>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <F label="Correo">
              <Input type="email" defaultValue={g.email} />
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="WhatsApp">
                <Input defaultValue={g.whatsapp} />
              </F>
              <F label="Teléfono">
                <Input defaultValue={g.phone} />
              </F>
            </div>
            <F label="Dirección">
              <Input defaultValue={g.address} />
            </F>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Localización</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-2">
            <F label="Zona horaria">
              <Input defaultValue={g.timezone} />
            </F>
            <F label="Idioma">
              <Input defaultValue={g.language} />
            </F>
            <F label="Moneda">
              <Input defaultValue={g.currency} />
            </F>
            <F label="IVA (%)">
              <Input type="number" defaultValue={g.iva} />
            </F>
            <F label="Compra mínima">
              <Input type="number" defaultValue={g.minPurchase} />
            </F>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Redes sociales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-2">
            <F label="Facebook">
              <Input defaultValue={g.social.facebook} />
            </F>
            <F label="Instagram">
              <Input defaultValue={g.social.instagram} />
            </F>
            <F label="Twitter">
              <Input defaultValue={g.social.twitter} />
            </F>
            <F label="LinkedIn">
              <Input defaultValue={g.social.linkedin} />
            </F>
            <F label="YouTube">
              <Input defaultValue={g.social.youtube} />
            </F>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
