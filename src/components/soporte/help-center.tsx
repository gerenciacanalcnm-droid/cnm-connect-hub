import { useState } from "react";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CATEGORIES = [
  { name: "Primeros pasos", count: 12, color: "bg-blue-500/10 text-blue-600" },
  { name: "Envíos SMS", count: 24, color: "bg-emerald-500/10 text-emerald-600" },
  { name: "Facturación", count: 9, color: "bg-amber-500/10 text-amber-600" },
  { name: "API & Webhooks", count: 18, color: "bg-purple-500/10 text-purple-600" },
  { name: "CRM & Contactos", count: 15, color: "bg-rose-500/10 text-rose-600" },
  { name: "Cuenta y seguridad", count: 7, color: "bg-slate-500/10 text-slate-600" },
];

const FAQ = [
  {
    q: "¿Cuánto tarda en entregarse un SMS?",
    a: "El 98% se entrega en menos de 5 segundos. Las rutas premium priorizan operadores tier-1 en México y Latinoamérica.",
  },
  {
    q: "¿Cómo se cobran los SMS largos?",
    a: "Un SMS estándar contiene 160 caracteres GSM-7. Los mensajes más largos se dividen en partes concatenadas y cada parte se factura como un envío.",
  },
  {
    q: "¿Puedo importar mis contactos desde Excel?",
    a: "Sí. El importador acepta CSV y XLSX, detecta duplicados y normaliza números al formato E.164 automáticamente.",
  },
  {
    q: "¿La plataforma tiene sandbox para pruebas?",
    a: "Sí. Las API keys con prefijo cnm_test no consumen créditos y devuelven eventos simulados en tus webhooks.",
  },
  {
    q: "¿Cómo funciona la facturación electrónica?",
    a: "Emitimos CFDI 4.0 automáticamente al confirmar cada recarga. Puedes descargar PDF y XML desde Finanzas → Facturas.",
  },
  {
    q: "¿Ofrecen SLA para clientes Enterprise?",
    a: "Sí. Los planes Enterprise incluyen SLA del 99.95% con crédito de servicio automático y soporte 24/7 con manager dedicado.",
  },
];

export function HelpCenter() {
  const [q, setQ] = useState("");
  const filtered = FAQ.filter(
    (f) =>
      f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Centro de ayuda</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra respuestas, guías y tutoriales.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar en ayuda..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.name}
            className="group flex items-center justify-between rounded-xl border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-md"
          >
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.count} artículos</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={c.color}>
                {c.count}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preguntas frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filtered.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
