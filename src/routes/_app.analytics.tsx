import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={BarChart3}
      title="Analytics"
      description="Métricas, reportes y paneles configurables en tiempo real."
      sections={[
        "Dashboards personalizables",
        "Métricas de entrega y engagement",
        "Cohortes y funnels",
        "Exportación programada",
        "Comparativas por periodo",
        "Alertas por umbral",
      ]}
    />
  ),
});
