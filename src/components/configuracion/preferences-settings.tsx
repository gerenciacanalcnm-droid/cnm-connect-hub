import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/store/ui-store";

const NOTIF = [
  { id: "campaigns", label: "Campañas completadas", desc: "Cuando termina el envío de una campaña." },
  { id: "billing", label: "Facturación y recargas", desc: "Alertas de saldo bajo y nuevos cargos." },
  { id: "api", label: "Errores de API y webhooks", desc: "Fallos en integraciones y entregas." },
  { id: "security", label: "Alertas de seguridad", desc: "Inicios de sesión desde nuevos dispositivos." },
];

export function PreferencesSettings() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    campaigns: true, billing: true, api: true, security: true,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Idioma y región</CardTitle>
          <CardDescription>Personaliza formato de fecha, moneda e idioma.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Idioma</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as "es" | "en")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Zona horaria</Label>
            <Select defaultValue="mx">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mx">(UTC-6) Ciudad de México</SelectItem>
                <SelectItem value="ar">(UTC-3) Buenos Aires</SelectItem>
                <SelectItem value="es">(UTC+1) Madrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Select defaultValue="mxn">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mxn">MXN · Peso mexicano</SelectItem>
                <SelectItem value="usd">USD · Dólar</SelectItem>
                <SelectItem value="eur">EUR · Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificaciones</CardTitle>
          <CardDescription>Elige qué eventos quieres recibir por email y en la app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {NOTIF.map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-muted-foreground">{n.desc}</div>
              </div>
              <Switch
                checked={prefs[n.id]}
                onCheckedChange={(v) => {
                  setPrefs((p) => ({ ...p, [n.id]: v }));
                  toast.success("Preferencia guardada");
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
