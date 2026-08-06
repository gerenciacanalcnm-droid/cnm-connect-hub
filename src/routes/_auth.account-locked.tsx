import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/account-locked")({
  head: () => ({
    meta: [
      { title: "Cuenta bloqueada — SMS CNM" },
      { name: "description", content: "Tu cuenta ha sido bloqueada temporalmente." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Cuenta bloqueada — SMS CNM" },
      { property: "og:description", content: "Tu cuenta ha sido bloqueada temporalmente." },
    ],
  }),
  component: LockedPage,
});

function LockedPage() {
  return (
    <AuthShell
      eyebrow="Seguridad"
      title="Cuenta bloqueada temporalmente"
      description="Detectamos varios intentos fallidos. Por seguridad, hemos suspendido el acceso durante 15 minutos."
      footer={
        <>
          ¿Necesitas ayuda?{" "}
          <Link to="/soporte" className="font-medium text-primary hover:underline">
            Contactar soporte
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          Puedes desbloquear tu cuenta restableciendo tu contraseña o esperando 15 minutos e
          intentando de nuevo.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link to="/forgot-password">Restablecer contraseña</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/login">Volver a iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
