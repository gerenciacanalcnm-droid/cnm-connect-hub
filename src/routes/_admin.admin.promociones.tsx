import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommercialPromotions, usePromotionMutations } from "@/hooks/use-commercial";
import type { CommercialPromotion } from "@/types/commercial";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/promociones")({
  head: () => ({ meta: [{ title: "Promociones — Super Admin" }] }),
  component: PromoPage,
});

type Draft = {
  id?: string;
  name: string;
  code: string;
  kind: CommercialPromotion["kind"];
  value_type: CommercialPromotion["valueType"];
  value: number;
  description: string;
  channel: string | null;
  max_redemptions: number;
  starts_at: string | null;
  ends_at: string | null;
  status: CommercialPromotion["status"];
  auto_apply: boolean;
};

const empty: Draft = {
  name: "",
  code: "",
  kind: "coupon",
  value_type: "percent",
  value: 0,
  description: "",
  channel: null,
  max_redemptions: 0,
  starts_at: null,
  ends_at: null,
  status: "draft",
  auto_apply: false,
};

const STATUS_TONE: Record<CommercialPromotion["status"], string> = {
  draft: "border-border text-muted-foreground",
  active: "border-success/40 text-success",
  paused: "border-amber-500/30 text-amber-600",
  expired: "border-destructive/30 text-destructive",
};

function toDraft(p: CommercialPromotion): Draft {
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    kind: p.kind,
    value_type: p.valueType,
    value: p.value,
    description: p.description,
    channel: p.channel,
    max_redemptions: p.maxRedemptions,
    starts_at: p.startsAt,
    ends_at: p.endsAt,
    status: p.status,
    auto_apply: p.autoApply,
  };
}

const day = (v: string | null) => (v ? v.slice(0, 10) : "");

function PromoPage() {
  const { data: promos = [], isLoading } = useCommercialPromotions();
  const { upsert, remove } = usePromotionMutations();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);

  const columns = useMemo<ColumnDef<CommercialPromotion, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Nombre" },
      {
        accessorKey: "code",
        header: "Código",
        cell: (c) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.row.original.code}</code>
        ),
      },
      {
        accessorKey: "value",
        header: "Valor",
        cell: (c) =>
          c.row.original.valueType === "percent"
            ? `${c.row.original.value}%`
            : `${c.row.original.value} ${c.row.original.valueType === "units" ? "u." : ""}`,
      },
      {
        accessorKey: "redemptions",
        header: "Canjes",
        cell: (c) =>
          `${c.row.original.redemptions}/${c.row.original.maxRedemptions || "∞"}`,
      },
      { accessorKey: "startsAt", header: "Inicio", cell: (c) => day(c.row.original.startsAt) || "—" },
      { accessorKey: "endsAt", header: "Fin", cell: (c) => day(c.row.original.endsAt) || "—" },
      {
        accessorKey: "autoApply",
        header: "Automática",
        cell: (c) =>
          c.row.original.autoApply ? (
            <Badge variant="outline" className="border-nova/40 text-nova">
              Auto
            </Badge>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: (c) => (
          <Badge variant="outline" className={STATUS_TONE[c.row.original.status]}>
            {c.row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar promoción"
              onClick={() => {
                setDraft(toDraft(row.original));
                setOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar promoción"
              onClick={async () => {
                await remove.mutateAsync(row.original.id);
                toast.success("Promoción eliminada");
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [remove],
  );

  const save = async () => {
    if (!draft.name.trim() || !draft.code.trim()) {
      toast.error("Nombre y código son obligatorios");
      return;
    }
    try {
      await upsert.mutateAsync({ ...draft });
      toast.success(draft.id ? "Promoción actualizada" : "Promoción creada");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la promoción");
    }
  };

  return (
    <AdminPage
      title="Promociones"
      description="Códigos de descuento y campañas de aplicación automática."
      actions={
        <Button
          size="sm"
          onClick={() => {
            setDraft(empty);
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva promoción
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <DataTable
          data={promos}
          columns={columns}
          searchPlaceholder="Buscar código…"
          exportFilename="promociones"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar promoción" : "Nueva promoción"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Nombre</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Código</Label>
                <Input
                  value={draft.code}
                  onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={draft.value}
                  onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(v) => setDraft((d) => ({ ...d, kind: v as Draft["kind"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coupon">Cupón</SelectItem>
                    <SelectItem value="bonus">Bono</SelectItem>
                    <SelectItem value="discount">Descuento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Unidad</Label>
                <Select
                  value={draft.value_type}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, value_type: v as Draft["value_type"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                    <SelectItem value="units">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Estado</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft((d) => ({ ...d, status: v as Draft["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Inicio</Label>
                <Input
                  type="date"
                  value={day(draft.starts_at)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Fin</Label>
                <Input
                  type="date"
                  value={day(draft.ends_at)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Máximo de canjes (0 = ilimitado)</Label>
              <Input
                type="number"
                value={draft.max_redemptions}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, max_redemptions: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label>Aplicación automática</Label>
              <Switch
                checked={draft.auto_apply}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, auto_apply: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
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
