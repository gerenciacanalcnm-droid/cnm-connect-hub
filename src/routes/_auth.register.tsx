import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SocialProviders } from "@/components/auth/social-providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  company: z.string().min(2, "Ingresa tu empresa"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe incluir una mayúscula")
    .regex(/[0-9]/, "Debe incluir un número"),
  terms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los términos" }) }),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_auth/register")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — SMS CNM" },
      { name: "description", content: "Crea tu cuenta empresarial en SMS CNM." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Crear cuenta — SMS CNM" },
      { property: "og:description", content: "Crea tu cuenta empresarial en SMS CNM." },
    ],
  }),
  component: RegisterPage,
});

function PasswordStrength({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, label: "8+ caracteres" },
    { ok: /[A-Z]/.test(value), label: "Mayúscula" },
    { ok: /[0-9]/.test(value), label: "Número" },
    { ok: /[^A-Za-z0-9]/.test(value), label: "Símbolo" },
  ];
  return (
    <ul className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
      {rules.map((r) => (
        <li
          key={r.label}
          className={cn("flex items-center gap-1", r.ok ? "text-success" : "text-muted-foreground")}
        >
          <Check className={cn("h-3 w-3", !r.ok && "opacity-30")} />
          {r.label}
        </li>
      ))}
    </ul>
  );
}

function RegisterPage() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", company: "", email: "", password: "", terms: false as unknown as true },
  });
  const password = form.watch("password");

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: values.name, company_name: values.company },
      },
    });
    if (error) {
      toast.error("No pudimos crear la cuenta", { description: error.message });
      return;
    }
    toast.success("Cuenta creada", { description: "Ya puedes iniciar sesión." });
    navigate({ to: "/login" });
  }

  return (
    <AuthShell
      eyebrow="Crea tu cuenta"
      title="Empieza en minutos"
      description="Prueba SMS CNM gratis durante 14 días. Sin tarjeta requerida."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" placeholder="Ana López" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" placeholder="Acme S.A." {...form.register("company")} />
            {form.formState.errors.company && (
              <p className="text-xs text-destructive">{form.formState.errors.company.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email corporativo</Label>
          <Input id="email" type="email" placeholder="tu@empresa.com" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Ocultar" : "Mostrar"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength value={password} />
        </div>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <Checkbox
            className="mt-0.5"
            checked={!!form.watch("terms")}
            onCheckedChange={(v) => form.setValue("terms", (!!v) as true, { shouldValidate: true })}
          />
          <span>
            Acepto los{" "}
            <a href="#" className="text-primary hover:underline">Términos de servicio</a> y la{" "}
            <a href="#" className="text-primary hover:underline">Política de privacidad</a>.
          </span>
        </label>
        {form.formState.errors.terms && (
          <p className="-mt-2 text-xs text-destructive">{form.formState.errors.terms.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">
              o regístrate con
            </span>
          </div>
        </div>

        <SocialProviders />
      </form>
    </AuthShell>
  );
}
