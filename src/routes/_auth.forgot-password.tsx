import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({ email: z.string().email("Email inválido") });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — SMS CNM" },
      { name: "description", content: "Restablece el acceso a tu cuenta SMS CNM." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Recuperar contraseña — SMS CNM" },
      { property: "og:description", content: "Restablece el acceso a tu cuenta SMS CNM." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(v: FormValues) {
    const { error } = await supabase.auth.resetPasswordForEmail(v.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("No pudimos enviar el correo", { description: error.message });
      return;
    }
    setSent(v.email);
  }

  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      title={sent ? "Revisa tu correo" : "Olvidé mi contraseña"}
      description={
        sent
          ? `Enviamos instrucciones a ${sent}. El enlace expira en 30 minutos.`
          : "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña."
      }
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            ¿No recibiste el correo?{" "}
            <button
              className="font-medium text-primary hover:underline"
              onClick={() => setSent(null)}
            >
              Intentar de nuevo
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar enlace de recuperación
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
