import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MODULES = [
  "Dashboard", "Usuarios", "Empresas", "SMS", "WhatsApp", "CRM", "Campañas",
  "Reportes", "Recargas", "Facturación", "API", "CNM Nova", "Landing", "Configuración", "Seguridad",
];
const ACTIONS = ["Ver", "Crear", "Editar", "Eliminar", "Exportar"] as const;
const ROLES = ["Super Admin", "Admin Empresa", "Operador SMS", "Analista CRM", "Solo lectura"];

const seed = Object.fromEntries(
  ROLES.map((r) => [
    r,
    Object.fromEntries(MODULES.map((m) => [m, Object.fromEntries(ACTIONS.map((a) => [a, r === "Super Admin" || (r === "Admin Empresa" && a !== "Eliminar") || (r === "Solo lectura" && a === "Ver")]))]))
  ])
) as Record<string, Record<string, Record<string, boolean>>>;

export const Route = createFileRoute("/_admin/admin/permisos" as never)({
  head: () => ({ meta: [{ title: "Permisos — Super Admin" }] }),
  component: PermisosPage,
});

function PermisosPage() {
  const [role, setRole] = useState(ROLES[0]!);
  const [matrix, setMatrix] = useState(seed);

  const toggle = (m: string, a: string) =>
    setMatrix((prev) => ({ ...prev, [role]: { ...prev[role]!, [m]: { ...prev[role]![m]!, [a]: !prev[role]![m]![a] } } }));

  return (
    <AdminPage
      title="Matriz de Permisos"
      description="Configura qué puede hacer cada rol en cada módulo de la plataforma."
      actions={
        <div className="flex items-center gap-2">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" onClick={() => toast.success("Permisos guardados")}>Guardar cambios</Button>
        </div>
      }
    >
      <Card>
        <CardHeader><CardTitle>Permisos del rol: {role}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Módulo</th>
                  {ACTIONS.map((a) => <th key={a} className="px-4 py-3 text-center">{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{m}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} className="px-4 py-3 text-center">
                        <Switch checked={matrix[role]![m]![a]} onCheckedChange={() => toggle(m, a)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
