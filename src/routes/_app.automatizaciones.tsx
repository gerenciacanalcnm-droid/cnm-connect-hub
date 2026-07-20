import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={Zap}
      title="Automatizaciones"
      description="Flujos, disparadores y acciones para automatizar tu comunicación."
      sections={[
        "Editor visual de flujos",
        "Disparadores por evento",
        "Condiciones y ramificaciones",
        "Retrasos y ventanas horarias",
        "Integración con CRM y API",
        "Historial de ejecuciones",
      ]}
    />
  ),
});
