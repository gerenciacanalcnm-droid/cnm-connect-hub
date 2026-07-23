import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const SESSIONS = [
  { device: "MacBook Pro · Chrome", location: "Ciudad de México, MX", lastSeen: "Ahora", current: true },
  { device: "iPhone 15 · Safari", location: "Ciudad de México, MX", lastSeen: "hace 2 horas", current: false },
  { device: "Windows · Firefox", location: "Guadalajara, MX", lastSeen: "hace 3 días", current: false },
];

export function SecuritySettings() {
  const [twoFA, setTwoFA] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Contraseña
          </CardTitle>
          <CardDescription>Cámbiala periódicamente para mantener tu cuenta segura.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-3"
            onSubmit={(e) => { e.preventDefault(); toast.success("Contraseña actualizada"); }}>
            <div className="space-y-1.5">
              <Label htmlFor="s-cur">Actual</Label>
              <Input id="s-cur" type="password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-new">Nueva</Label>
              <Input id="s-new" type="password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-conf">Confirmar</Label>
              <Input id="s-conf" type="password" />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <Button type="submit">Actualizar contraseña</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Autenticación de dos factores
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium">Aplicación autenticadora</div>
            <div className="text-sm text-muted-foreground">Genera códigos temporales con Google Authenticator o 1Password.</div>
          </div>
          <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); toast.success(v ? "2FA activado" : "2FA desactivado"); }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" /> Sesiones activas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SESSIONS.map((s) => (
            <div key={s.device} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {s.device}
                  {s.current && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">Actual</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{s.location} · {s.lastSeen}</div>
              </div>
              {!s.current && (
                <Button size="sm" variant="ghost" className="text-destructive"
                  onClick={() => toast.success("Sesión cerrada")}>
                  Cerrar
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
