import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/logo";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[oklch(0.18_0.04_265)] text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(600px 400px at 20% 10%, oklch(0.55 0.22 285 / 0.35), transparent 60%), radial-gradient(500px 400px at 90% 90%, oklch(0.6 0.18 240 / 0.30), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative">
          <Link to="/" className="inline-flex">
            <Logo />
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Plataforma Enterprise
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
              Envía SMS a escala.
              <br />
              Con precisión de ingeniería.
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/70">
              Infraestructura de mensajería para equipos que no aceptan
              interrupciones. Automatización, analítica y CNM Nova, en un solo
              lugar.
            </p>
          </div>

          <ul className="space-y-4 text-sm">
            {[
              { icon: Zap, label: "Entregas en <2s con enrutamiento inteligente" },
              { icon: ShieldCheck, label: "Cifrado end-to-end, cumplimiento GDPR / LGPD" },
              { icon: Sparkles, label: "CNM Nova — copiloto IA para tus campañas" },
            ].map((f) => (
              <li key={f.label} className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur">
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="pt-1.5 text-white/85">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/50">
          © {new Date().getFullYear()} CNM Digital Media · Todos los derechos reservados
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
          <Link to="/">
            <Logo />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            )}

            <div className="mt-8">{children}</div>

            {footer && (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
