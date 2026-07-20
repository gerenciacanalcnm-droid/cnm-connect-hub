import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/soporte")({
  head: () => ({ meta: [{ title: "Soporte · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={LifeBuoy}
      title="Soporte"
      description="Tickets, centro de ayuda y contacto directo con el equipo."
      sections={[
        "Nuevo ticket de soporte",
        "Historial de conversaciones",
        "Centro de ayuda",
        "Guías y tutoriales",
        "Estado del servicio",
        "Contacto prioritario",
      ]}
    />
  ),
});
