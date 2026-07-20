import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/mi-empresa")({
  head: () => ({ meta: [{ title: "Mi Empresa · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={Building2}
      title="Mi Empresa"
      description="Datos fiscales, marca, dominios y branding corporativo."
      sections={[
        "Datos fiscales",
        "Logotipo e identidad",
        "Dominios y subdominios",
        "Direcciones",
        "Contactos de la empresa",
        "Documentos legales",
      ]}
    />
  ),
});
