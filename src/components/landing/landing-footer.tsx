import {
  Instagram,
  Linkedin,
  MessageCircle,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  whatsapp: MessageCircle,
};

export function LandingFooter() {
  const { brand, footer } = useLandingContent();
  return (
    <footer className="relative border-t border-border/70 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <img
              src={brand.logoUrl}
              alt={`${brand.productName} — ${brand.companyName}`}
              className="h-9 w-auto"
              loading="lazy"
            />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{footer.tagline}</p>
            <div className="mt-5 flex items-center gap-2">
              {footer.social.map((s) => {
                const Icon = SOCIAL_ICONS[s.kind] ?? MessageCircle;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {col.title}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">{footer.legalNote}</p>
          <p className="text-xs text-muted-foreground">
            {brand.companyName} · {brand.domain}
          </p>
        </div>
      </div>
    </footer>
  );
}
