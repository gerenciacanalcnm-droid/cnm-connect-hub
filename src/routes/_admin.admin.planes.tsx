import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { defaultPlans, type Plan } from "@/config/admin.config";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Plus, Star, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/planes")({
  head: () => ({ meta: [{ title: "Planes — Super Admin" }] }),
  component: PlanesPage,
});

function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [open, setOpen] = useState(false);

  return (
    <AdminPage
      title="Planes comerciales"
      description="Configura los paquetes que verán los clientes en la Landing y en el panel."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Nuevo plan</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo plan</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5"><Label>Nombre</Label><Input /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>SMS</Label><Input type="number" /></div>
                <div className="grid gap-1.5"><Label>Precio</Label><Input type="number" /></div>
              </div>
              <div className="grid gap-1.5"><Label>Descripción</Label><Textarea rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Etiqueta</Label><Input placeholder="Más popular" /></div>
                <div className="grid gap-1.5"><Label>Color</Label><Input type="color" defaultValue="#8b5cf6" /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { setOpen(false); toast.success("Plan creado"); }}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.sort((a,b) => a.order - b.order).map((p) => (
          <Card key={p.id} className="relative overflow-hidden">
            {p.featured && <div className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} />}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{p.name}</CardTitle>
                    {p.label && <Badge style={{ backgroundColor: `${p.color}20`, color: p.color, borderColor: `${p.color}40` }} variant="outline">{p.label}</Badge>}
                  </div>
                  <CardDescription className="mt-1">{p.description}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Destacar" onClick={() => setPlans((ps) => ps.map((x) => x.id === p.id ? { ...x, featured: !x.featured } : x))}><Star className={`h-3.5 w-3.5 ${p.featured ? "fill-amber-400 text-amber-400" : ""}`} /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1"><span className="text-3xl font-bold">{formatCurrency(p.price)}</span></div>
              <p className="text-sm text-muted-foreground">{formatNumber(p.sms)} SMS incluidos</p>
              <div className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                <span className="flex items-center gap-1.5">{p.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Visible</span>
                <Switch checked={p.visible} onCheckedChange={() => setPlans((ps) => ps.map((x) => x.id === p.id ? { ...x, visible: !x.visible } : x))} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1"><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Button>
                <Button variant="ghost" size="icon" onClick={() => setPlans((ps) => ps.filter((x) => x.id !== p.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPage>
  );
}
