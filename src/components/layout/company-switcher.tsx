import { Check, ChevronsUpDown, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompanyContext } from "@/context/company-context";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const { current, available, switchTo } = useCompanyContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-9 max-w-[220px] justify-between gap-2 md:inline-flex"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-primary/10 text-primary">
            <Building2 className="h-3 w-3" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
            {current.name}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Empresas ({available.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.map((c) => {
          const active = c.id === current.id;
          return (
            <DropdownMenuItem
              key={c.id}
              onSelect={() => switchTo(c.id)}
              className="flex items-start gap-2.5 py-2"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent">
                <Building2 className="h-4 w-4 text-accent-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {c.domain} · {c.currency}
                </p>
              </div>
              <Check className={cn("mt-2 h-4 w-4 shrink-0", !active && "opacity-0")} />
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-sm text-muted-foreground">
          <Plus className="h-4 w-4" />
          Añadir empresa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
