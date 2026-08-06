import { Plus, Copy, Pencil, Trash2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const TEMPLATES = [
  {
    id: "1",
    name: "OTP Login",
    category: "Verificación",
    body: "Tu código de acceso es {{codigo}}. Válido por 5 minutos.",
    used: 12480,
  },
  {
    id: "2",
    name: "Recordatorio cita",
    category: "Recordatorios",
    body: "Hola {{nombre}}, te esperamos mañana a las {{hora}}. Responde SI para confirmar.",
    used: 4210,
  },
  {
    id: "3",
    name: "Promo Black Friday",
    category: "Marketing",
    body: "{{nombre}}, 30% OFF hoy en {{tienda}}. Compra: {{url}}",
    used: 8104,
  },
  {
    id: "4",
    name: "Envío en camino",
    category: "Notificaciones",
    body: "Tu pedido #{{orden}} está en camino. Rastréalo: {{url}}",
    used: 6820,
  },
  {
    id: "5",
    name: "Encuesta NPS",
    category: "Feedback",
    body: "¿Nos recomendarías del 0 al 10? Responde con el número.",
    used: 1560,
  },
  {
    id: "6",
    name: "Recuperación carrito",
    category: "Marketing",
    body: "{{nombre}}, olvidaste algo. Termina tu compra: {{url}}",
    used: 2340,
  },
];

export function Templates() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button className="gap-2" onClick={() => toast.info("Editor de plantillas próximamente")}>
          <Plus className="h-4 w-4" /> Nueva plantilla
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Card key={t.id} className="group transition hover:shadow-md">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium leading-tight">{t.name}</div>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {t.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {t.used.toLocaleString("es-MX")} usos
                </div>
              </div>
              <p className="line-clamp-3 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                {t.body}
              </p>
              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Duplicar
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
