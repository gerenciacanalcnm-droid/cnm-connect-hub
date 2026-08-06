import { ArrowRight, Terminal } from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";

export function ApiSection() {
  const { api } = useLandingContent();
  return (
    <section id="api" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            API & Desarrolladores
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{api.title}</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {api.description}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {api.items.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/70 bg-card p-4">
                <div className="text-sm font-semibold text-foreground">{item.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </div>

          <a
            href={api.cta.href}
            className="group mt-8 inline-flex h-11 items-center gap-2 rounded-lg gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]"
          >
            {api.cta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-nova/15 to-transparent blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-[oklch(0.16_0.02_260)] shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <div className="ml-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/60">
                <Terminal className="h-3 w-3" />
                {api.snippet.language}
              </div>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed text-white/90">
              <code className="font-mono">{api.snippet.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
