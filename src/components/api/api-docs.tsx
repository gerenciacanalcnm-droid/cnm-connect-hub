import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SNIPPETS = {
  curl: `curl -X POST https://api.smscnm.com/v1/sms \\
  -H "Authorization: Bearer $CNM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+525512345678",
    "message": "Hola desde SMS CNM",
    "sender": "CNM"
  }'`,
  node: `import { CnmClient } from "@smscnm/sdk";

const cnm = new CnmClient({ apiKey: process.env.CNM_API_KEY! });

await cnm.sms.send({
  to: "+525512345678",
  message: "Hola desde SMS CNM",
  sender: "CNM",
});`,
  python: `from smscnm import CnmClient

cnm = CnmClient(api_key=os.environ["CNM_API_KEY"])

cnm.sms.send(
    to="+525512345678",
    message="Hola desde SMS CNM",
    sender="CNM",
)`,
  php: `<?php
$cnm = new \\SmsCnm\\Client(getenv('CNM_API_KEY'));
$cnm->sms->send([
  'to' => '+525512345678',
  'message' => 'Hola desde SMS CNM',
  'sender' => 'CNM',
]);`,
};

const ENDPOINTS = [
  { method: "POST", path: "/v1/sms", desc: "Envía un SMS individual" },
  { method: "POST", path: "/v1/sms/bulk", desc: "Envío masivo hasta 100.000 destinos" },
  { method: "GET", path: "/v1/sms/:id", desc: "Estado y trazabilidad del mensaje" },
  { method: "POST", path: "/v1/campaigns", desc: "Crea una campaña programable" },
  { method: "GET", path: "/v1/analytics/summary", desc: "Métricas agregadas por período" },
  { method: "POST", path: "/v1/contacts/import", desc: "Importa contactos con dedupe" },
];

export function ApiDocs() {
  const [lang, setLang] = useState<keyof typeof SNIPPETS>("curl");
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(SNIPPETS[lang]);
    setCopied(true);
    toast.success("Copiado");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3 overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Quickstart</CardTitle>
          <Button size="sm" variant="ghost" onClick={copy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={lang} onValueChange={(v) => setLang(v as keyof typeof SNIPPETS)}>
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>
            {(Object.keys(SNIPPETS) as (keyof typeof SNIPPETS)[]).map((k) => (
              <TabsContent key={k} value={k} className="mt-4">
                <pre className="overflow-x-auto rounded-lg bg-[oklch(0.15_0.02_260)] p-4 text-xs leading-relaxed text-slate-100">
                  <code>{SNIPPETS[k]}</code>
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ENDPOINTS.map((e) => (
            <div
              key={e.path}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
            >
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px]",
                  e.method === "GET"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                )}
              >
                {e.method}
              </Badge>
              <div className="min-w-0 flex-1">
                <code className="block truncate font-mono text-xs font-medium">{e.path}</code>
                <p className="text-xs text-muted-foreground">{e.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
