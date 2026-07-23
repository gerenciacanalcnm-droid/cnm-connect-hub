import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/session-expired")({
  head: () => ({
    meta: [
      { title: "Sesión expirada — SMS CNM" },
      { name: "description", content: "Tu sesión ha expirado. Vuelve a iniciar sesión." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Sesión expirada — SMS CNM" },
      { property: "og:description", content: "Tu sesión ha expirado. Vuelve a iniciar sesión." },
    ],
  }),
  component: ExpiredPage,
});

function ExpiredPage() {
  return (
    <AuthShell
      eyebrow="Sesión finalizada"
      title="Tu sesión ha expirado"
      description="Por tu seguridad, cerramos automáticamente sesiones inactivas. Vuelve a iniciar sesión para continuar."
      footer={
        <Link to="/" className="font-medium text-primary hover:underline">
          Ir a la página principal
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-warning/10 text-warning">
          <Clock className="h-5 w-5" />
        </div>
        <Button asChild className="w-full">
          <Link to="/login">Iniciar sesión de nuevo</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
