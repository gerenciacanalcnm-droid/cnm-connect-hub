import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/landing-cms" as never)({
  head: () => ({ meta: [{ title: "Landing CMS — Super Admin" }] }),
  component: LandingCms,
});

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  );
}

function LandingCms() {
  return (
    <AdminPage
      title="Landing CMS"
      description="Contenido editable de la Landing pública. Se sirve vía LandingService."
      actions={<Button size="sm" onClick={() => toast.success("Contenido publicado")}>Publicar cambios</Button>}
    >
      <Tabs defaultValue="hero">
        <TabsList className="flex-wrap">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="features">Características</TabsTrigger>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <TabsContent value="hero" className="mt-4">
          <Section title="Hero" description="Título principal, subtítulo y CTA de la landing.">
            <div className="grid gap-1.5"><Label>Título</Label><Input defaultValue="La plataforma de comunicación empresarial de nueva generación" /></div>
            <div className="grid gap-1.5"><Label>Subtítulo</Label><Textarea rows={3} defaultValue="SMS, WhatsApp y CRM unificados en un centro inteligente potenciado por IA." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>CTA Primario</Label><Input defaultValue="Empezar gratis" /></div>
              <div className="grid gap-1.5"><Label>CTA Secundario</Label><Input defaultValue="Ver demo" /></div>
            </div>
          </Section>
        </TabsContent>
        <TabsContent value="features" className="mt-4">
          <Section title="Características" description="Tarjetas mostradas en la landing.">
            <div className="grid gap-1.5"><Label>Título de sección</Label><Input defaultValue="Todo lo que necesitas para escalar" /></div>
            <div className="grid gap-1.5"><Label>Descripción</Label><Textarea rows={2} defaultValue="Módulos integrados que trabajan juntos desde el primer día." /></div>
          </Section>
        </TabsContent>
        <TabsContent value="plans" className="mt-4"><Section title="Planes" description="Los planes se administran desde el módulo Planes."><p className="text-sm text-muted-foreground">La landing consume automáticamente los planes visibles del catálogo.</p></Section></TabsContent>
        <TabsContent value="faq" className="mt-4"><Section title="FAQ"><div className="grid gap-1.5"><Label>Preguntas (una por línea)</Label><Textarea rows={8} defaultValue={"¿Qué operadores están soportados?\n¿Cómo se factura?\n¿Puedo cancelar en cualquier momento?"} /></div></Section></TabsContent>
        <TabsContent value="cta" className="mt-4"><Section title="CTA Final"><div className="grid gap-1.5"><Label>Título</Label><Input defaultValue="Empieza a enviar hoy mismo" /></div><div className="grid gap-1.5"><Label>Botón</Label><Input defaultValue="Crear cuenta" /></div></Section></TabsContent>
        <TabsContent value="footer" className="mt-4"><Section title="Footer"><div className="grid gap-1.5"><Label>Texto legal</Label><Input defaultValue="© 2026 CNM Digital Media" /></div></Section></TabsContent>
        <TabsContent value="contact" className="mt-4">
          <Section title="Contacto y Redes">
            <div className="grid gap-1.5"><Label>Correo</Label><Input type="email" defaultValue="contacto@canalcnm.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Facebook</Label><Input /></div>
              <div className="grid gap-1.5"><Label>Instagram</Label><Input /></div>
              <div className="grid gap-1.5"><Label>Twitter</Label><Input /></div>
              <div className="grid gap-1.5"><Label>LinkedIn</Label><Input /></div>
            </div>
          </Section>
        </TabsContent>
        <TabsContent value="media" className="mt-4"><Section title="Videos y banners"><div className="grid gap-1.5"><Label>URL video hero</Label><Input placeholder="https://…" /></div><div className="grid gap-1.5"><Label>Banner superior</Label><Input placeholder="Texto opcional del banner" /></div></Section></TabsContent>
      </Tabs>
    </AdminPage>
  );
}
