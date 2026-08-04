import { useState } from "react";
import { Plus, Star, Trash2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useWhatsAppAccounts,
  useSaveWhatsAppAccount,
  useDeleteWhatsAppAccount,
  useSetPrimaryWhatsAppAccount,
} from "@/hooks/use-whatsapp";
import type { WhatsAppDepartment } from "@/types/communication";
import { toast } from "sonner";

const DEPARTMENTS: { value: WhatsAppDepartment; label: string }[] = [
  { value: "ventas", label: "Ventas" },
  { value: "soporte", label: "Soporte" },
  { value: "cobranza", label: "Cobranza" },
  { value: "marketing", label: "Marketing" },
  { value: "general", label: "General" },
];

export function WhatsAppAccounts() {
  const { data: accounts, isLoading } = useWhatsAppAccounts();
  const save = useSaveWhatsAppAccount();
  const remove = useDeleteWhatsAppAccount();
  const makePrimary = useSetPrimaryWhatsAppAccount();

  const [open, setOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [department, setDepartment] = useState<WhatsAppDepartment>("general");
  const [displayPhone, setDisplayPhone] = useState("");

  const submit = async () => {
    if (!alias.trim()) return toast.error("El alias es obligatorio");
    try {
      await save.mutateAsync({ alias, department, displayPhone });
      toast.success("Número registrado");
      setOpen(false);
      setAlias("");
      setDisplayPhone("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <div className="flex-1">
            <CardTitle className="text-base">Meta Embedded Signup</CardTitle>
            <CardDescription>
              La arquitectura está lista para recibir las credenciales oficiales de Meta. La
              conexión real se habilita en la siguiente actualización.
            </CardDescription>
          </div>
          <Badge variant="outline">Meta Ready</Badge>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Números registrados</h3>
          <p className="text-xs text-muted-foreground">
            Administra múltiples números por departamento.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Añadir número
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo número WhatsApp</DialogTitle>
              <DialogDescription>
                Se guardará como pendiente hasta completar la verificación con Meta.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Alias</Label>
                <Input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Ventas Bogotá"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Departamento</Label>
                <Select
                  value={department}
                  onValueChange={(v) => setDepartment(v as WhatsAppDepartment)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Número visible</Label>
                <Input
                  value={displayPhone}
                  onChange={(e) => setDisplayPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={save.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : !accounts?.length ? (
        <EmptyState
          title="Sin números registrados"
          description="Añade tu primer número de WhatsApp Business para preparar el canal."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id} className="border-border/70">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{a.alias}</p>
                    {a.isPrimary && (
                      <Badge className="gap-1 text-[10px]">
                        <Star className="h-3 w-3" /> Principal
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.displayPhone ?? "Sin número asignado"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {a.department}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {a.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {!a.isPrimary && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => makePrimary.mutate(a.id)}
                      aria-label="Marcar como principal"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove.mutate(a.id)}
                    aria-label="Eliminar número"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
