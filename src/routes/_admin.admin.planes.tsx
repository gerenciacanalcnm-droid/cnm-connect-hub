import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCommercialFeatures,
  useCommercialPlans,
  usePlanMutations,
} from "@/hooks/use-commercial";
import type { CommercialPlan } from "@/types/commercial";
import { formatCurrency } from "@/lib/format";
import { Plus, Eye, EyeOff, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/planes")({
  head: () => ({ meta: [{ title: "Planes — Super Admin" }] }),
  component: PlanesPage,
});

type Draft = {
  id?: string;
  code: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  color: string;
  icon: string;
  badge: string | null;
  sort_order: number;
  is_visible: boolean;
  is_active: boolean;
};

const emptyDraft: Draft = {
  code: "",
  name: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  currency: "COP",
  color: "#8b5cf6",
  icon: "Package",
  badge: null,
  sort_order: 0,
  is_visible: true,
  is_active: true,
};

function toDraft(p: CommercialPlan): Draft {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    price_monthly: p.priceMonthly,
    price_yearly: p.priceYearly,
    currency: p.currency,
    color: p.color,
    icon: p.icon,
    badge: p.badge,
    sort_order: p.sortOrder,
    is_visible: p.isVisible,
    is_active: p.isActive,
  };
}

function PlanesPage() {
  const { data: plans = [], isLoading } = useCommercialPlans();
  const { data: features = [] } = useCommercialFeatures();
  const { upsert, remove, duplicate, setFeature, setLimit } = usePlanMutations();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<CommercialPlan | null>(null);

  const sorted = useMemo(() => [...plans].sort((a, b) => a.sortOrder - b.sortOrder), [plans]);
  const editingPlan = editing ? (plans.find((p) => p.id === editing.id) ?? editing) : null;

  const save = async () => {
    if (!draft.code.trim() || !draft.name.trim()) {
      toast.error("Código y nombre son obligatorios");
      return;
    }
    try {
      await upsert.mutateAsync({ ...draft });
      toast.success(draft.id ? "Plan actualizado" : "Plan creado");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el plan");
    }
  };

  return (
    <AdminPage
      title="Planes comerciales"
      description="Configura los paquetes que verán los clientes en la Landing y en el panel."
      actions={
        <Button
          size="sm"
          onClick={() => {
            setDraft({ ...emptyDraft, sort_order: plans.length });
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo plan
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sorted.map((p) => (
            <Card key={p.id} className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{p.name}</CardTitle>
                      {p.badge && (
                        <Badge
                          style={{
                            backgroundColor: `${p.color}20`,
                            color: p.color,
                            borderColor: `${p.color}40`,
                          }}
                          variant="outline"
                        >
                          {p.badge}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">{p.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Duplicar plan"
                    onClick={async () => {
                      await duplicate.mutateAsync(p.id);
                      toast.success("Plan duplicado");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {formatCurrency(p.priceMonthly, p.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ mes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.features.filter((f) => f.included).length} funcionalidades · {p.limits.length}{" "}
                  límites
                </p>
                <div className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    {p.isVisible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}{" "}
                    Visible
                  </span>
                  <Switch
                    checked={p.isVisible}
                    onCheckedChange={(v) => upsert.mutate({ ...toDraft(p), is_visible: v })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setDraft(toDraft(p));
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar plan"
                    onClick={async () => {
                      await remove.mutateAsync(p.id);
                      toast.success("Plan eliminado");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? `Editar ${draft.name}` : "Nuevo plan"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="features" disabled={!editingPlan}>
                Funcionalidades
              </TabsTrigger>
              <TabsTrigger value="limits" disabled={!editingPlan}>
                Límites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Código</Label>
                  <Input
                    value={draft.code}
                    onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Nombre</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Precio mensual</Label>
                  <Input
                    type="number"
                    value={draft.price_monthly}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, price_monthly: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Precio anual</Label>
                  <Input
                    type="number"
                    value={draft.price_yearly}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, price_yearly: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Descripción</Label>
                <Textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label>Etiqueta</Label>
                  <Input
                    placeholder="Más popular"
                    value={draft.badge ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value || null }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={draft.color}
                    onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label>Visible en la Landing</Label>
                <Switch
                  checked={draft.is_visible}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, is_visible: v }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label>Activo</Label>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="features" className="max-h-80 space-y-2 overflow-y-auto py-2">
              {features.map((f) => {
                const included =
                  editingPlan?.features.find((x) => x.featureKey === f.key)?.included ?? false;
                return (
                  <div
                    key={f.key}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                    <Switch
                      checked={included}
                      onCheckedChange={(v) =>
                        editingPlan &&
                        setFeature.mutate({
                          planId: editingPlan.id,
                          featureKey: f.key,
                          included: v,
                        })
                      }
                    />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="limits" className="max-h-80 space-y-2 overflow-y-auto py-2">
              {(editingPlan?.limits ?? []).map((l) => (
                <div
                  key={l.limitKey}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{l.limitKey}</p>
                    <p className="text-xs text-muted-foreground">{l.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-28"
                      type="number"
                      defaultValue={l.limitValue}
                      onBlur={(e) =>
                        editingPlan &&
                        setLimit.mutate({
                          planId: editingPlan.id,
                          limitKey: l.limitKey,
                          limitValue: Number(e.target.value),
                          unit: l.unit,
                          isUnlimited: l.isUnlimited,
                        })
                      }
                    />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Ilimitado
                      <Switch
                        checked={l.isUnlimited}
                        onCheckedChange={(v) =>
                          editingPlan &&
                          setLimit.mutate({
                            planId: editingPlan.id,
                            limitKey: l.limitKey,
                            limitValue: l.limitValue,
                            unit: l.unit,
                            isUnlimited: v,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editingPlan && editingPlan.limits.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Este plan no tiene límites configurados.
                </p>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {draft.id ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
