import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { NovaChat } from "@/components/nova/nova-chat";

export const Route = createFileRoute("/_app/nova")({
  head: () => ({
    meta: [
      { title: "CNM Nova · SMS CNM" },
      {
        name: "description",
        content: "Tu copiloto con IA para segmentar, optimizar y analizar campañas.",
      },
    ],
  }),
  component: NovaPage,
});

function NovaPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="CNM Nova"
        description="Copiloto con IA para optimizar tus campañas de comunicación."
        actions={
          <Badge variant="secondary" className="gap-1.5 bg-nova-soft text-nova">
            <Sparkles className="h-3 w-3" /> IA en tiempo real
          </Badge>
        }
      />
      <NovaChat />
    </div>
  );
}
