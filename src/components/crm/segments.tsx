import { Plus, Filter, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

const SEGMENTS = [
  { name: "Alto valor (LTV > $10k)", rules: 3, contacts: 842, updated: "Actualizado hace 2h" },
  { name: "Región Norte activos", rules: 2, contacts: 3120, updated: "Actualizado hoy" },
  { name: "Sin compra 60d", rules: 4, contacts: 1980, updated: "Actualizado hoy" },
  { name: "Cumpleaños del mes", rules: 1, contacts: 340, updated: "Actualizado diariamente" },
  { name: "Suscritos SMS + Email", rules: 2, contacts: 4210, updated: "Actualizado hace 4h" },
];

export function Segments() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo segmento
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SEGMENTS.map((s) => (
          <Card key={s.name} className="transition hover:shadow-md">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.updated}</div>
                </div>
              </div>
              <div className="flex items-end justify-between border-t border-border pt-3">
                <div>
                  <div className="text-2xl font-semibold">{formatNumber(s.contacts)}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Filter className="h-3 w-3" /> {s.rules} reglas
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Ver contactos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
