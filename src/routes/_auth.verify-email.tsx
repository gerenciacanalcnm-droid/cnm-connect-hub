import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/verify-email")({
  head: () => ({
    meta: [
      { title: "Verifica tu email — SMS CNM" },
      { name: "description", content: "Confirma tu email para activar tu cuenta." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Verifica tu email — SMS CNM" },
      { property: "og:description", content: "Confirma tu email para activar tu cuenta." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();

  function setDigit(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  async function submit() {
    if (code.some((c) => !c)) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Email verificado");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell
      eyebrow="Verificación"
      title="Confirma tu email"
      description="Enviamos un código de 6 dígitos a tu correo. Ingrésalo para activar tu cuenta."
      footer={
        <>
          ¿Email incorrecto?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Cambiar dirección
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-5 w-5" />
        </div>

        <div className="flex justify-center gap-2">
          {code.map((c, i) => (
            <Input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={c}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus();
              }}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-11 text-center text-lg font-semibold"
              aria-label={`Dígito ${i + 1}`}
            />
          ))}
        </div>

        <Button className="w-full" onClick={submit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verificar y continuar
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ¿No recibiste el código?{" "}
          <button className="font-medium text-primary hover:underline" type="button">
            Reenviar en 30s
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
