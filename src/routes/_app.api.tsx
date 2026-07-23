import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeysTable } from "@/components/api/api-keys-table";
import { WebhooksTable } from "@/components/api/webhooks-table";
import { ApiLogsTable } from "@/components/api/api-logs-table";
import { ApiDocs } from "@/components/api/api-docs";

export const Route = createFileRoute("/_app/api")({
  head: () => ({
    meta: [
      { title: "API Center · SMS CNM" },
      { name: "description", content: "API keys, webhooks, logs y documentación de la API SMS CNM." },
    ],
  }),
  component: ApiPage,
});

function ApiPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="API Center"
        description="Claves, webhooks, logs y documentación para tus integraciones."
      />
      <Tabs defaultValue="docs" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="docs">Documentación</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="docs"><ApiDocs /></TabsContent>
        <TabsContent value="keys"><ApiKeysTable /></TabsContent>
        <TabsContent value="webhooks"><WebhooksTable /></TabsContent>
        <TabsContent value="logs"><ApiLogsTable /></TabsContent>
      </Tabs>
    </div>
  );
}
