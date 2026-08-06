import { motion } from "framer-motion";
import { useLandingContent } from "@/hooks/use-landing-content";

export function HowItWorksSection() {
  const { steps } = useLandingContent();
  return (
    <section id="soluciones" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Cómo funciona
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            De cero a producción en 5 pasos.
          </h2>
        </div>

        <ol className="relative mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <motion.li
              key={s.step}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-sm font-bold text-primary-foreground shadow-md">
                {s.step}
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
