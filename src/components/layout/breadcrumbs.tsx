import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { primaryNavigation } from "@/config/navigation";

const labelMap: Record<string, string> = (() => {
  const m: Record<string, string> = { dashboard: "Dashboard" };
  for (const s of primaryNavigation) for (const it of s.items) {
    m[it.to.replace(/^\//, "")] = it.title;
  }
  return m;
})();

function humanize(seg: string) {
  return (
    labelMap[seg] ??
    seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Migas de pan"
      className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground md:flex"
    >
      <Link
        to="/dashboard"
        className="inline-flex items-center rounded p-1 hover:text-foreground"
        aria-label="Inicio"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((seg, i) => {
        const to = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={to} className="inline-flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            {isLast ? (
              <span className="truncate font-medium text-foreground">
                {humanize(seg)}
              </span>
            ) : (
              <Link
                to={to}
                className="truncate hover:text-foreground"
              >
                {humanize(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
