import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/admin-page";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Plus, 
  Link, 
  Unlink, 
  Building2, 
  Phone, 
  Activity,
  History
} from "lucide-react";
import { toast } from "sonner";
import { 
  getInventoryNumbers, 
  assignNumberToCompany, 
  unassignNumber,
  getAssignmentAudit
} from "@/lib/whatsapp-inventory.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_admin/admin/whatsapp-inventory")({
  head: () => ({ meta: [{ title: "Inventario de Números WhatsApp — Super Admin" }] }),
  component: WhatsAppInventoryPage,
});

function WhatsAppInventoryPage() {
  const queryClient = useQueryClient();
  const [isAssignOpen, setIsAssignOpen] = React.useState(false);
  const [isAuditOpen, setIsAuditOpen] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");

  const { data: numbers = [], isLoading } = useQuery({
    queryKey: ["whatsapp-inventory"],
    queryFn: () => getInventoryNumbers(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: audits = [], isLoading: isLoadingAudit } = useQuery({
    queryKey: ["whatsapp-assignment-audit", selectedAccount?.id],
    queryFn: () => getAssignmentAudit({ accountId: selectedAccount?.id }),
    enabled: isAuditOpen,
  });

  const assignMutation = useMutation({
    mutationFn: assignNumberToCompany,
    onSuccess: () => {
      toast.success("Número asignado correctamente");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-inventory"] });
      setIsAssignOpen(false);
      setSelectedCompanyId("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const unassignMutation = useMutation({
    mutationFn: unassignNumber,
    onSuccess: () => {
      toast.success("Número desasignado correctamente");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-inventory"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleAssign = () => {
    if (!selectedAccount || !selectedCompanyId) return;
    assignMutation.mutate({
      accountId: selectedAccount.id,
      companyId: selectedCompanyId,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Asignado</Badge>;
      case "AVAILABLE":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Disponible</Badge>;
      case "DISCONNECTED":
        return <Badge variant="secondary">Desconectado</Badge>;
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminPage
      title="Inventario de Números WhatsApp"
      description="Administra los números de WhatsApp propiedad de Nova y asígnalos a empresas clientes."
      actions={
        <Button size="sm" onClick={() => toast.info("Funcionalidad de registro manual próximamente")}>
          <Plus className="mr-2 h-4 w-4" /> Registrar Número
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> Inventario Central
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número / Alias</TableHead>
                  <TableHead>WABA / Phone ID</TableHead>
                  <TableHead>Estado Nova</TableHead>
                  <TableHead>Empresa Asignada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Cargando inventario...</TableCell>
                  </TableRow>
                ) : numbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">No hay números en el inventario.</TableCell>
                  </TableRow>
                ) : (
                  numbers.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{n.phone_number || n.display_phone || "Sin número"}</span>
                          <span className="text-xs text-muted-foreground">{n.alias}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>WABA: {n.waba_id || n.business_account_id || "—"}</span>
                          <span>ID: {n.phone_number_id || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(n.nova_status)}</TableCell>
                      <TableCell>
                        {n.companies ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{n.companies.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No asignado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Historial"
                            onClick={() => {
                              setSelectedAccount(n);
                              setIsAuditOpen(true);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          
                          {n.nova_status === "AVAILABLE" ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1.5"
                              onClick={() => {
                                setSelectedAccount(n);
                                setIsAssignOpen(true);
                              }}
                            >
                              <Link className="h-3.5 w-3.5" /> Asignar
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(`¿Deseas quitar este número de la empresa ${n.companies?.name}?`)) {
                                  unassignMutation.mutate({ accountId: n.id });
                                }
                              }}
                              disabled={unassignMutation.isPending}
                            >
                              <Unlink className="h-3.5 w-3.5" /> Desasignar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Asignación */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Número WhatsApp</DialogTitle>
            <DialogDescription>
              Selecciona la empresa que tendrá autorización para utilizar este número.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{(selectedAccount?.phone_number || selectedAccount?.display_phone) ?? "—"}</span>
                          <span className="text-xs text-muted-foreground">{selectedAccount?.alias}</span>
                        </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa Cliente</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAssignOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending || !selectedCompanyId}>
              {assignMutation.isPending ? "Asignando..." : "Confirmar Asignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Auditoría */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Historial de Asignaciones
            </DialogTitle>
            <DialogDescription>
              Trazabilidad de cambios para {(selectedAccount?.phone_number || selectedAccount?.alias) ?? "—"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingAudit ? (
              <div className="flex justify-center py-8 italic text-muted-foreground">Cargando historial...</div>
            ) : audits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay registros de auditoría.</div>
            ) : (
              <div className="relative border-l-2 border-muted ml-3 space-y-6">
                {audits.map((a: any) => (
                  <div key={a.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-background bg-muted-foreground shadow-sm" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {a.action}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(a.created_at), "PPP p", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm">
                        {a.action === 'ASSIGN_NUMBER' && (
                          <>Asignado a <span className="font-semibold">{a.new_company?.name}</span></>
                        )}
                        {a.action === 'UNASSIGN_NUMBER' && (
                          <>Desasignado de <span className="font-semibold">{a.old_company?.name}</span></>
                        )}
                        {a.action === 'TRANSFER_NUMBER' && (
                          <>Transferido de <span className="font-semibold">{a.old_company?.name}</span> a <span className="font-semibold">{a.new_company?.name}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="ghost" onClick={() => setIsAuditOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
