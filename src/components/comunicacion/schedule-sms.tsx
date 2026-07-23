import { useState } from "react";
import { CalendarClock, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmsComposer } from "./sms-composer";
import { toast } from "sonner";

export function ScheduleSms() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [tz, setTz] = useState("America/Mexico_City");
  const [msg, setMsg] = useState("");
  const [recurring, setRecurring] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" /> Programar SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <Select value={tz} onValueChange={setTz}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Mexico_City">CDMX (GMT-6)</SelectItem>
                  <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                  <SelectItem value="America/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                  <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="text-sm font-medium">Envío recurrente</div>
              <div className="text-xs text-muted-foreground">Repetir semanalmente en el mismo horario.</div>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>
          <SmsComposer value={msg} onChange={setMsg} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline">Vista previa</Button>
            <Button onClick={() => toast.success("SMS programado correctamente")}>
              Programar envío
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" /> Próximos envíos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { d: "Mañana 09:00", n: "Recordatorio de cita — 2 340 dest." },
            { d: "Vie 18:00", n: "Promo fin de semana — 8 210 dest." },
            { d: "Dom 20:00", n: "Encuesta NPS — 1 120 dest." },
          ].map((x) => (
            <div key={x.d} className="rounded-lg border border-border p-3">
              <div className="font-medium">{x.d}</div>
              <div className="text-xs text-muted-foreground">{x.n}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
