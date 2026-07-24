import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { adminConfig } from "@/config/admin.config";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/seguridad" as never)({
  head: () => ({ meta: [{ title: "Seguridad — Super Admin" }] }),
  component: SecPage,
});

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0"><p className="text-sm font-medium">{title}</p>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SecPage() {
  const s = adminConfig.security;
  return (
    <AdminPage title="Seguridad" description="Autenticación, contraseñas y políticas de sesión." actions={<Button size="sm" onClick={() => toast.success("Guardado")}>Guardar</Button>}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Autenticación</CardTitle><CardDescription>Métodos habilitados.</CardDescription></CardHeader>
          <CardContent className="divide-y divide-border">
            <Row title="Google OAuth" description="Login con cuenta Google."><Switch defaultChecked={s.googleOAuth} /></Row>
            <Row title="Two-Factor (2FA)" description="Verificación en dos pasos obligatoria."><Switch defaultChecked={s.twoFactor} /></Row>
            <Row title="Captcha" description="Protección contra bots en login/registro."><Switch defaultChecked={s.captcha} /></Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sesiones y tokens</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>JWT expira (min)</Label><Input type="number" defaultValue={s.jwtExpiryMinutes} /></div>
              <div className="grid gap-1.5"><Label>Refresh (días)</Label><Input type="number" defaultValue={s.refreshExpiryDays} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Máximo de sesiones concurrentes</Label><Input type="number" defaultValue={s.maxSessions} /></div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Política de contraseñas</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5"><Label>Longitud mínima</Label><Input type="number" defaultValue={s.passwordMinLength} /></div>
            <div className="divide-y divide-border rounded-md border border-border px-3">
              <Row title="Mayúscula obligatoria"><Switch defaultChecked={s.requireUppercase} /></Row>
              <Row title="Número obligatorio"><Switch defaultChecked={s.requireNumber} /></Row>
              <Row title="Símbolo obligatorio"><Switch defaultChecked={s.requireSymbol} /></Row>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
