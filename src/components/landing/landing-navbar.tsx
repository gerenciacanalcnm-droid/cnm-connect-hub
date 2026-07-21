import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingContent } from "@/hooks/use-landing-content";

export function LandingNavbar() {
  const { brand, nav } = useLandingContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 shadow-sm backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex items-center gap-2.5">
          <img
            src={brand.logoUrl}
            alt={`${brand.productName} — ${brand.companyName}`}
            className="h-8 w-auto"
            loading="eager"
          />
          <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:inline">
            {brand.productName}
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={nav.login.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            {nav.login.label}
          </a>
          <a
            href={nav.signup.href}
            className="group inline-flex items-center gap-1.5 rounded-md gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
          >
            {nav.signup.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-border/60 bg-background/95 backdrop-blur lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {nav.items.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/90 hover:bg-accent"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
                <a
                  href={nav.login.href}
                  className="rounded-md border border-border px-3 py-2.5 text-center text-sm font-medium"
                >
                  {nav.login.label}
                </a>
                <a
                  href={nav.signup.href}
                  className="rounded-md gradient-brand px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                >
                  {nav.signup.label}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
