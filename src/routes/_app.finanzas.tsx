import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RechargePanel } from "@/components/finanzas/recharge-panel";
import { RechargeHistory } from "@/components/finanzas/recharge-history";
import { InvoicesTable } from "@/components/finanzas/invoices-table";
import { PaymentMethods } from "@/components/finanzas/payment-methods";

export const Route = createFileRoute("/_app/finanzas")({
  head: () => ({
    meta: [
      { title: "Finanzas · SMS CNM" },
      { name: "description", content: "Recargas, facturación, métodos de pago y consumo." },
    ],
  }),
  component: FinanzasPage,
});

function FinanzasPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Finanzas"
        description="Recargas de créditos, facturación electrónica y métodos de pago."
      />
      <Tabs defaultValue="recargas" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="recargas">Recargas</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="metodos">Métodos de pago</TabsTrigger>
        </TabsList>
        <TabsContent value="recargas">
          <RechargePanel />
        </TabsContent>
        <TabsContent value="historial">
          <RechargeHistory />
        </TabsContent>
        <TabsContent value="facturas">
          <InvoicesTable />
        </TabsContent>
        <TabsContent value="metodos">
          <PaymentMethods />
        </TabsContent>
      </Tabs>
    </div>
  );
}
