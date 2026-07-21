import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";
import { cn } from "@/lib/utils";

export function NovaSection() {
  const { nova } = useLandingContent();

  return (
    <section id="nova" className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-nova/15 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.15]" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-nova/30 bg-nova/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-nova">
            <Sparkles className="h-3 w-3" />
            IA nativa
          </div>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient-nova">{nova.title}</span>
          </h2>
          <p className="mt-4 text-xl font-medium text-foreground/90">
            {nova.subtitle}
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {nova.description}
          </p>

          <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {nova.capabilities.map((c) => (
              <li
                key={c}
                className="flex items-start gap-2 rounded-lg border border-border/60 bg-card/60 p-3 backdrop-blur-sm"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-nova/15 text-nova">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm text-foreground">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Chat mockup */}
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-nova/25 via-primary/15 to-transparent blur-2xl" />
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xl sm:p-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-nova text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">CNM Nova</div>
                <div className="text-[11px] text-muted-foreground">
                  En línea · respondiendo en tiempo real
                </div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Activo
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {nova.conversation.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className={cn(
                    "flex",
                    m.from === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      m.from === "user"
                        ? "gradient-brand text-primary-foreground rounded-br-sm"
                        : "border border-border bg-background text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Sparkles className="h-4 w-4 text-nova" />
              <span className="text-sm text-muted-foreground">
                Pregúntale algo a CNM Nova…
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
