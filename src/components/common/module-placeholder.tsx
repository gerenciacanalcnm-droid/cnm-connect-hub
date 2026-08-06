import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "./page-header";

export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
  sections,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  sections: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3 w-3" />
            En preparación
          </Badge>
        }
      />

      <Card className="overflow-hidden border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div className="max-w-xl space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Módulo listo para desarrollo</h2>
            <p className="text-sm text-muted-foreground">
              La arquitectura base de <span className="font-medium text-foreground">{title}</span>{" "}
              está preparada. Este módulo se construirá sobre el sistema de diseño, rutas,
              autenticación y servicios comunes de SMS CNM.
            </p>
          </div>
          <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
            {sections.map((s) => (
              <div
                key={s}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="truncate text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
