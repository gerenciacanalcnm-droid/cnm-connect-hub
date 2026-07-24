import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, RefreshCw, Server, Database, HardDrive, Cpu, ListChecks } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/sistema" as never)({
  head: () => ({ meta: [{ title: "Sistema — Super Admin" }] }),
  component: SistemaPage,
});

function SistemaPage() {
  return (
    <AdminPage
      title="Sistema"
      description="Salud, versión y recursos de la infraestructura."
      actions={<Button variant="outline" size="sm" onClick={() => toast.success("Health check ejecutado")}><RefreshCw className="mr-1.5 h-4 w-4" />Health check</Button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0"><Server className="h-5 w-5 text-primary" /><div><CardTitle className="text-base">Versión</CardTitle><CardDescription>Backend + Frontend</CardDescription></div></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">API</span><Badge variant="outline">v5.4.2</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frontend</span><Badge variant="outline">v5.4.2</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Build</span><code className="text-xs">a1f9b2c</code></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><div><CardTitle className="text-base">Health</CardTitle><CardDescription>Todos los servicios operativos</CardDescription></div></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {["API", "Database", "Cache", "Queue", "Storage"].map((s) => (
              <div key={s} className="flex justify-between"><span>{s}</span><Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">OK</Badge></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0"><Cpu className="h-5 w-5 text-nova" /><div><CardTitle className="text-base">Recursos</CardTitle><CardDescription>Uso actual</CardDescription></div></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><div className="mb-1 flex justify-between text-xs"><span>CPU</span><span>34%</span></div><Progress value={34} /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>Memoria</span><span>62%</span></div><Progress value={62} /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>Storage</span><span>48%</span></div><Progress value={48} /></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />Cache y Queue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm"><span>Cache (Redis)</span><Button variant="outline" size="sm" onClick={() => toast.success("Cache limpiado")}>Limpiar</Button></div>
            <div className="flex items-center justify-between text-sm"><span>Queue jobs pendientes</span><Badge variant="outline">124</Badge></div>
            <div className="flex items-center justify-between text-sm"><span>Queue failed</span><Badge variant="outline" className="border-amber-500/30 text-amber-600">3</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" />Variables de entorno</CardTitle><CardDescription>Detectadas en el entorno actual (solo lectura).</CardDescription></CardHeader>
          <CardContent className="space-y-1 text-xs font-mono">
            {["NODE_ENV=production", "TZ=America/Bogota", "SMS_PROVIDER=infobip", "API_RATE_LIMIT=120", "JWT_TTL=60m"].map((v) => (
              <div key={v} className="rounded bg-muted px-2 py-1">{v}</div>
            ))}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" />Storage</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Assets</p><p className="mt-1 text-xl font-semibold">18.2 GB</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Backups</p><p className="mt-1 text-xl font-semibold">124.7 GB</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Logs</p><p className="mt-1 text-xl font-semibold">6.4 GB</p></div>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
