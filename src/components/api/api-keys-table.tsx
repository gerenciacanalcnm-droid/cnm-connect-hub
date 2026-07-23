import { useMemo, useState } from "react";
import { Copy, KeyRound, Plus, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useApiKeys } from "@/hooks/use-api-keys";
import { apiKeyRepository } from "@/repositories/api-key.repository";
import type { ApiKey } from "@/types/api-key";
import { queryKeys } from "@/hooks/queries/keys";

export function ApiKeysTable() {
  const { data, isLoading, error, refetch } = useApiKeys();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("sms:send, sms:read");
  const [created, setCreated] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<ApiKey>[]>(() => [
    {
      accessorKey: "name", header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
            <KeyRound className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{row.original.masked}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "scopes", header: "Scopes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.scopes.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="font-mono text-[10px]">{s}</Badge>
          ))}
        </div>
      ),
    },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: "lastUsedAt", header: "Último uso",
      cell: ({ row }) => row.original.lastUsedAt
        ? new Date(row.original.lastUsedAt).toLocaleString("es-MX")
        : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Button
          size="sm" variant="ghost" className="gap-1.5 text-destructive"
          disabled={row.original.status === "revoked"}
          onClick={async (e) => {
            e.stopPropagation();
            await apiKeyRepository.revokeKey(row.original.id);
            qc.invalidateQueries({ queryKey: queryKeys.apiKeys });
            toast.success("Key revocada");
          }}>
          <ShieldOff className="h-3.5 w-3.5" /> Revocar
        </Button>
      ),
    },
  ], [qc]);

  const submit = async () => {
    const scopeList = scopes.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await apiKeyRepository.createKey({ name: name || "Nueva key", scopes: scopeList });
    setCreated(res.plainSecret);
    setName("");
    qc.invalidateQueries({ queryKey: queryKeys.apiKeys });
  };

  if (isLoading) return <SkeletonTable rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCreated(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> Nueva API key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear API key</DialogTitle>
              <DialogDescription>Otorga acceso programático a la plataforma.</DialogDescription>
            </DialogHeader>
            {created ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Copia esta key ahora. No podrás verla de nuevo.
                </p>
                <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                  <code className="flex-1 truncate font-mono text-xs">{created}</code>
                  <Button size="sm" variant="ghost"
                    onClick={() => { navigator.clipboard.writeText(created); toast.success("Copiado"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="k-name">Nombre</Label>
                  <Input id="k-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Backend producción" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="k-scopes">Scopes</Label>
                  <Input id="k-scopes" value={scopes} onChange={(e) => setScopes(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            )}
            <DialogFooter>
              {created
                ? <Button onClick={() => { setOpen(false); setCreated(null); }}>Listo</Button>
                : <Button onClick={submit}>Crear</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={data ?? []} columns={columns} />
    </div>
  );
}
