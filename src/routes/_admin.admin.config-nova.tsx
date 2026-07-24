import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { adminConfig } from "@/config/admin.config";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/config-nova" as never)({
  head: () => ({ meta: [{ title: "CNM Nova — Super Admin" }] }),
  component: NovaConfig,
});

function NovaConfig() {
  const n = adminConfig.nova;
  const [temp, setTemp] = useState<number[]>([n.temperature * 10]);
  const [tokens, setTokens] = useState<number[]>([n.maxTokens]);
  return (
    <AdminPage title="CNM Nova" description="Comportamiento del copiloto IA." actions={<Button size="sm" onClick={() => toast.success("Configuración de Nova guardada")}>Guardar</Button>}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modelo</CardTitle><CardDescription>Motor IA y parámetros de generación.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Modelo IA</Label>
              <Select defaultValue={n.model}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="claude-opus-4.5">Claude Opus 4.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>Temperatura</Label><span className="text-sm font-medium">{(temp[0]! / 10).toFixed(1)}</span></div>
              <Slider value={temp} onValueChange={setTemp} min={0} max={20} step={1} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>Máximo tokens</Label><span className="text-sm font-medium">{tokens[0]}</span></div>
              <Slider value={tokens} onValueChange={setTokens} min={128} max={4096} step={128} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Instrucciones</CardTitle><CardDescription>Prompt maestro y mensaje de bienvenida.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5"><Label>System Prompt</Label><Textarea rows={6} defaultValue={n.systemPrompt} /></div>
            <div className="grid gap-1.5"><Label>Mensaje de bienvenida</Label><Textarea rows={2} defaultValue={n.welcome} /></div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Acciones permitidas</CardTitle><CardDescription>Herramientas que Nova puede ejecutar.</CardDescription></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {n.allowedActions.map((a) => <Badge key={a} variant="outline" className="border-nova/40 bg-nova/5 text-nova">{a}</Badge>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
