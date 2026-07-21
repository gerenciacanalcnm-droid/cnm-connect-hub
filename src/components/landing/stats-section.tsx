import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLandingContent } from "@/hooks/use-landing-content";
import type { LandingStat } from "@/config/landing-content";

function formatValue(value: number, stat: LandingStat) {
  if (stat.format === "decimal") return value.toFixed(2);
  if (stat.format === "percent") return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(
    Math.round(value),
  );
}

function Counter({ stat }: { stat: LandingStat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(stat.value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, stat.value]);

  return (
    <span ref={ref} className="tabular-nums">
      {stat.prefix}
      {formatValue(value, stat)}
      {stat.suffix}
    </span>
  );
}

export function StatsSection() {
  const { stats } = useLandingContent();
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-12">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.2]" />
          <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  <Counter stat={s} />
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
