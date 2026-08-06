import { Users, Plus, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

const GROUPS = [
  {
    id: "1",
    name: "Clientes VIP",
    contacts: 1204,
    tag: "vip",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "2",
    name: "Nuevos 30 días",
    contacts: 2380,
    tag: "onboarding",
    color: "from-emerald-400 to-teal-500",
  },
  {
    id: "3",
    name: "Inactivos 90 días",
    contacts: 3210,
    tag: "reactivación",
    color: "from-rose-400 to-pink-500",
  },
  {
    id: "4",
    name: "Carrito abandonado",
    contacts: 812,
    tag: "e-commerce",
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "5",
    name: "Suscriptores newsletter",
    contacts: 5480,
    tag: "newsletter",
    color: "from-purple-400 to-fuchsia-500",
  },
  {
    id: "6",
    name: "Bogotá + Medellín",
    contacts: 2140,
    tag: "geo",
    color: "from-cyan-400 to-sky-500",
  },
];

export function Groups() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo grupo
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((g) => (
          <Card key={g.id} className="overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${g.color}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg bg-gradient-to-br ${g.color} p-2 text-white shadow-sm`}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">#{g.tag}</div>
                  </div>
                </div>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {formatNumber(g.contacts)}
                  </div>
                  <div className="text-xs text-muted-foreground">contactos</div>
                </div>
                <Button size="sm" variant="outline">
                  Enviar SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
