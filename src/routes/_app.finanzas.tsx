import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/finanzas")({
  head: () => ({ meta: [{ title: "Finanzas · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={Wallet}
      title="Finanzas"
      description="Facturación, consumo, planes y métodos de pago."
      sections={[
        "Facturación electrónica",
        "Historial de consumo",
        "Planes y suscripciones",
        "Métodos de pago",
        "Recargas y saldo",
        "Recibos y descargas",
      ]}
    />
  ),
});
