import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SocialProviders } from "@/components/auth/social-providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_auth/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — SMS CNM" },
      { name: "description", content: "Accede a tu cuenta SMS CNM." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Iniciar sesión — SMS CNM" },
      { property: "og:description", content: "Accede a tu cuenta SMS CNM." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error("No pudimos iniciar sesión", { description: error.message });
      return;
    }
    toast.success("Sesión iniciada");
    // check role → route to /admin/dashboard when super_admin
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const { data: rr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.user.id);
      const isAdmin = (rr ?? []).some((r) => r.role === "super_admin");
      navigate({ to: isAdmin ? "/admin/dashboard" : "/dashboard" });
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <AuthShell
      eyebrow="Bienvenido de vuelta"
      title="Inicia sesión"
      description="Accede al centro de comando de tu operación SMS."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email corporativo</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@empresa.com"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={form.watch("remember")}
            onCheckedChange={(v) => form.setValue("remember", !!v)}
          />
          Mantener sesión iniciada
        </label>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Iniciar sesión
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">
              o continúa con
            </span>
          </div>
        </div>

        <SocialProviders />
      </form>
    </AuthShell>
  );
}
