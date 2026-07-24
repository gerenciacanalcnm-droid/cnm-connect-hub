import { Bell, HelpCircle, LifeBuoy, Keyboard, BookOpen, Search, Sparkles, Shield } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { CompanySwitcher } from "@/components/layout/company-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useUIStore } from "@/store/ui-store";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function Topbar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setNovaOpen = useUIStore((s) => s.setNovaOpen);
  const setNotificationsOpen = useUIStore((s) => s.setNotificationsOpen);
  const { data: unread = 0 } = useUnreadCount();
  const { user, profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const displayName = profile?.full_name || user?.email || "Cuenta";
  const displayEmail = user?.email ?? "";
  const initials = (profile?.full_name ?? user?.email ?? "CN")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="h-8 w-8" />
      <Separator orientation="vertical" className="h-5" />
      <CompanySwitcher />
      <Separator orientation="vertical" className="hidden h-5 md:block" />


      {/* Global search */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group inline-flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm text-muted-foreground shadow-xs transition-all hover:border-border-strong hover:bg-accent/40 hover:shadow-sm sm:max-w-md"
        aria-label="Buscar en toda la plataforma"
      >
        <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-foreground" />
        <span className="min-w-0 flex-1 truncate">
          Buscar clientes, campañas, contactos, SMS, API…
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
          className="group relative hidden h-9 gap-1.5 overflow-hidden gradient-nova text-white shadow-md transition-transform hover:scale-[1.02] hover:opacity-95 md:inline-flex"
        >
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
          <Sparkles className="h-3.5 w-3.5" />
          CNM Nova
        </Button>
        <Button
          onClick={() => setNovaOpen(true)}
          size="icon"
          className="h-9 w-9 gradient-nova text-white shadow-md hover:opacity-95 md:hidden"
          aria-label="CNM Nova"
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        <ThemeToggle />
        <LanguageSwitcher />

        {/* Help */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden h-9 w-9 md:inline-flex" aria-label="Ayuda">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ayuda
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <BookOpen className="h-4 w-4" /> Documentación
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onSelect={() => setCommandOpen(true)}>
              <Keyboard className="h-4 w-4" /> Atajos de teclado
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <LifeBuoy className="h-4 w-4" /> Contactar soporte
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notificaciones"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />


        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Menú de usuario"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? ""} alt={displayName} />
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                  {initials || "CN"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{displayName}</span>
              {displayEmail && (
                <span className="text-xs font-normal text-muted-foreground">{displayEmail}</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Mi perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuItem>Facturación</DropdownMenuItem>
            {isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/admin/dashboard" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Super Admin
                  </a>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>Centro de ayuda</DropdownMenuItem>
            <DropdownMenuItem>Novedades</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={handleSignOut}
            >
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
