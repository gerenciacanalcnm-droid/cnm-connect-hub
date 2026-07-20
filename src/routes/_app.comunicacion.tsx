import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/comunicacion")({
  head: () => ({ meta: [{ title: "Comunicación · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={MessageSquare}
      title="Comunicación"
      description="Gestión unificada de SMS, campañas y mensajería multicanal."
      sections={[
        "Envío individual y masivo de SMS",
        "Plantillas y variables dinámicas",
        "Programación de campañas",
        "Historial y trazabilidad",
        "Números y remitentes",
        "Segmentación por audiencia",
      ]}
    />
  ),
});
