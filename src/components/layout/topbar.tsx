import { Bell, Search, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useUIStore } from "@/store/ui-store";

export function Topbar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setNovaOpen = useUIStore((s) => s.setNovaOpen);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="h-8 w-8" />
      <Separator orientation="vertical" className="h-5" />

      {/* Global search */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group inline-flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm text-muted-foreground transition-colors hover:border-border-strong hover:bg-accent/40 sm:max-w-md"
        aria-label="Buscar en toda la plataforma"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          Buscar contactos, campañas, mensajes…
        </span>
        <kbd className="hidden shrink-0 items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {/* CNM Nova */}
        <Button
          onClick={() => setNovaOpen(true)}
          size="sm"
          className="hidden h-9 gap-1.5 gradient-brand text-primary-foreground shadow-sm hover:opacity-95 md:inline-flex"
        >
          <Sparkles className="h-3.5 w-3.5" />
          CNM Nova
        </Button>
        <Button
          onClick={() => setNovaOpen(true)}
          size="icon"
          className="h-9 w-9 gradient-brand text-primary-foreground shadow-sm hover:opacity-95 md:hidden"
          aria-label="CNM Nova"
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        <ThemeToggle />

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notificaciones</p>
              <Badge variant="secondary" className="text-[10px]">
                Próximamente
              </Badge>
            </div>
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No hay notificaciones nuevas.
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Menú de usuario"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                  CN
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">CNM Digital Media</span>
              <span className="text-xs font-normal text-muted-foreground">
                admin@canalcnm.com
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Mi perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuItem>Facturación</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Centro de ayuda</DropdownMenuItem>
            <DropdownMenuItem>Novedades</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
