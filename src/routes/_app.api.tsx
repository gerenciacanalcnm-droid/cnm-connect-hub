import { createFileRoute } from "@tanstack/react-router";
import { Code2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/api")({
  head: () => ({ meta: [{ title: "API · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={Code2}
      title="API"
      description="Claves, webhooks y documentación de la API REST de SMS CNM."
      sections={[
        "Gestión de API keys",
        "Webhooks y eventos",
        "Documentación interactiva",
        "Ejemplos de código",
        "Logs de peticiones",
        "Límites y cuotas",
      ]}
    />
  ),
});
