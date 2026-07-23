import { Activity, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SERVICES = [
  { name: "API REST", uptime: 99.99, status: "operational" },
  { name: "Envío SMS Nacional", uptime: 99.97, status: "operational" },
  { name: "Envío SMS Internacional", uptime: 99.92, status: "operational" },
  { name: "Webhooks", uptime: 99.95, status: "operational" },
  { name: "Panel Web", uptime: 100, status: "operational" },
  { name: "CNM Nova (IA)", uptime: 99.88, status: "operational" },
];

export function ServiceStatus() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          Estado del servicio
        </CardTitle>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          Todos los sistemas operativos
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {SERVICES.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">Operativo · últimos 90 días</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden gap-0.5 sm:flex">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span key={i} className="h-6 w-1 rounded-full bg-emerald-500/70" />
                ))}
              </div>
              <span className="w-16 text-right font-mono text-sm font-semibold text-emerald-600">
                {s.uptime.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
