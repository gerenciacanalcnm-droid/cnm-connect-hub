import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ShoppingCart, Sparkles, TrendingDown } from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";
import { formatCurrency, formatNumber } from "@/lib/format";

export function CalculatorSection() {
  const { calculator } = useLandingContent();
  const [amount, setAmount] = useState<number>(calculator.defaultAmount);

  const { pricePerSms, quantity, saving, baseTotal } = useMemo(() => {
    const sorted = [...calculator.tiers].sort((a, b) => a.minAmount - b.minAmount);
    const applicable = sorted
      .filter((t) => amount >= t.minAmount)
      .pop() ?? sorted[0];
    const base = sorted[0];
    const qty = applicable ? Math.floor(amount / applicable.pricePerSms) : 0;
    const baseQty = base ? Math.floor(amount / base.pricePerSms) : 0;
    const baseTotalCost = baseQty * (base?.pricePerSms ?? 0);
    const currentCost = qty * (applicable?.pricePerSms ?? 0);
    const savingValue = Math.max(0, baseTotalCost - currentCost);
    return {
      pricePerSms: applicable?.pricePerSms ?? 0,
      quantity: qty,
      saving: savingValue,
      baseTotal: baseTotalCost,
    };
  }, [amount, calculator.tiers]);

  const valid = amount >= calculator.minInvestment;
  const min = calculator.minInvestment;
  const max = calculator.tiers[calculator.tiers.length - 1]?.minAmount ?? min * 60;

  return (
    <section id="calculadora" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Calculadora
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Simula tu inversión.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Ajusta el monto y descubre cuántos SMS obtienes y cuánto ahorras.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="relative mt-12 overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-xl sm:p-10"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-nova/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Calculator className="h-3 w-3" />
                Simulador
              </div>

              <label
                htmlFor="invest"
                className="mt-5 block text-sm font-medium text-foreground"
              >
                ¿Cuánto deseas invertir?
              </label>

              <div className="mt-2 flex items-stretch rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30">
                <span className="grid place-items-center px-3 text-sm font-semibold text-muted-foreground">
                  $
                </span>
                <input
                  id="invest"
                  type="number"
                  min={min}
                  step={10000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full bg-transparent py-3 pr-3 text-lg font-semibold tabular-nums text-foreground outline-none"
                />
                <span className="grid place-items-center px-3 text-xs font-medium text-muted-foreground">
                  {calculator.currency}
                </span>
              </div>

              <input
                type="range"
                min={min}
                max={max}
                step={50000}
                value={Math.min(Math.max(amount, min), max)}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-4 w-full accent-primary"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Compra mínima: {formatCurrency(min, calculator.currency)}
              </p>
              {!valid && (
                <p className="mt-2 text-xs font-medium text-destructive">
                  El monto debe ser mayor o igual a la compra mínima.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cantidad de SMS
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                  {formatNumber(quantity)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Precio aplicado
                  </div>
                  <div className="mt-1 text-xl font-semibold text-foreground">
                    {formatCurrency(pricePerSms, calculator.currency)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">/ SMS</div>
                </div>
                <div className="rounded-2xl border border-success/30 bg-success/10 p-5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-success">
                    <TrendingDown className="h-3 w-3" /> Ahorro
                  </div>
                  <div className="mt-1 text-xl font-semibold text-success">
                    {formatCurrency(saving, calculator.currency)}
                  </div>
                  <div className="text-[11px] text-success/80">
                    vs. tarifa base
                  </div>
                </div>
              </div>

              <a
                href="/dashboard"
                aria-disabled={!valid}
                className="group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl gradient-brand text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.01] aria-disabled:pointer-events-none aria-disabled:opacity-60"
              >
                <ShoppingCart className="h-4 w-4" />
                Comprar ahora
                <Sparkles className="h-4 w-4 opacity-80" />
              </a>
              <p className="text-[11px] text-muted-foreground">
                Valor total base a esta tarifa:{" "}
                {formatCurrency(baseTotal, calculator.currency)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
