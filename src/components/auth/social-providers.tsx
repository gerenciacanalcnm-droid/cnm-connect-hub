import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const providers = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.5l2.63-2.53C16.86 3.4 14.66 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.93 0 9.2-4.86 9.2-7.4 0-.5-.06-.9-.13-1.2H12z" />
      </svg>
    ),
  },
  {
    id: "microsoft",
    label: "Microsoft",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="#F25022" d="M2 2h10v10H2z" />
        <path fill="#7FBA00" d="M12 2h10v10H12z" />
        <path fill="#00A4EF" d="M2 12h10v10H2z" />
        <path fill="#FFB900" d="M12 12h10v10H12z" />
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.5.12-3.13 0 0 .97-.31 3.2 1.18a11 11 0 0 1 5.82 0c2.23-1.5 3.2-1.18 3.2-1.18.64 1.63.24 2.83.12 3.13.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
      </svg>
    ),
  },
] as const;

export function SocialProviders() {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="grid grid-cols-3 gap-2">
        {providers.map((p) => (
          <Tooltip key={p.id}>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="w-full gap-2 opacity-70"
                  aria-label={`Continuar con ${p.label} (próximamente)`}
                >
                  {p.icon}
                  <span className="hidden sm:inline">{p.label}</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Próximamente</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
