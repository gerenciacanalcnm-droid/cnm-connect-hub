import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/crm")({
  head: () => ({ meta: [{ title: "CRM · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={Users}
      title="CRM"
      description="Contactos, empresas, oportunidades y segmentos inteligentes."
      sections={[
        "Ficha 360º de contacto",
        "Segmentación avanzada",
        "Etiquetas y campos personalizados",
        "Importación y sincronización",
        "Historial de interacciones",
        "Panel de oportunidades",
      ]}
    />
  ),
});
