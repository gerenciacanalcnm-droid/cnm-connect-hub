import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/store/ui-store";
import { primaryNavigation } from "@/config/navigation";
import { useContacts } from "@/hooks/use-contacts";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useInvoices } from "@/hooks/use-invoices";
import { useSms } from "@/hooks/use-sms";
import { Users, MessageSquare, Receipt, Send, Sparkles, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setNovaOpen = useUIStore((s) => s.setNovaOpen);
  const setNotificationsOpen = useUIStore((s) => s.setNotificationsOpen);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");

  const { data: contactsData } = useContacts();
  const { data: campaignsData } = useCampaigns();
  const { data: invoicesData } = useInvoices();
  const { data: smsData } = useSms();

  const contacts = contactsData?.items ?? [];
  const campaigns = campaignsData?.items ?? [];
  const invoices = invoicesData ?? [];
  const sms = smsData?.items ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  function run(fn: () => void) {
    setOpen(false);
    setTimeout(fn, 50);
  }

  const filteredContacts = useMemo(
    () => contacts.slice(0, 5),
    [contacts],
  );
  const filteredCampaigns = useMemo(() => campaigns.slice(0, 5), [campaigns]);
  const filteredInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);
  const filteredSms = useMemo(() => sms.slice(0, 5), [sms]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar clientes, campañas, SMS, facturas o comandos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Acciones rápidas">
          <CommandItem onSelect={() => run(() => setNovaOpen(true))}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Abrir CNM Nova
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setNotificationsOpen(true))}>
            <Bell className="mr-2 h-4 w-4" />
            Ver notificaciones
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/comunicacion" }))}>
            <Send className="mr-2 h-4 w-4" />
            Enviar nuevo SMS
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegación">
          {primaryNavigation.flatMap((s) => s.items).map((item) => (
            <CommandItem
              key={item.to}
              value={`nav ${item.title} ${item.to}`}
              onSelect={() => run(() => navigate({ to: item.to }))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
              <span className="ml-auto text-xs text-muted-foreground">{item.to}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {filteredContacts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contactos">
              {filteredContacts.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`contact ${c.firstName} ${c.lastName} ${c.phone}`}
                  onSelect={() => run(() => navigate({ to: "/crm" }))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {c.firstName} {c.lastName}
                  <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredCampaigns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Campañas">
              {filteredCampaigns.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`campaign ${c.name}`}
                  onSelect={() => run(() => navigate({ to: "/comunicacion" }))}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {c.name}
                  <span className="ml-auto text-xs text-muted-foreground">{c.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredSms.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="SMS recientes">
              {filteredSms.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`sms ${m.to} ${m.message}`}
                  onSelect={() => run(() => navigate({ to: "/comunicacion" }))}
                >
                  <Send className="mr-2 h-4 w-4" />
                  <span className="truncate">{m.to}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground">{m.message}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredInvoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Facturas">
              {filteredInvoices.map((inv) => (
                <CommandItem
                  key={inv.id}
                  value={`invoice ${inv.number}`}
                  onSelect={() => run(() => navigate({ to: "/finanzas" }))}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  {inv.number}
                  <span className="ml-auto text-xs text-muted-foreground">{inv.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Preferencias">
          <CommandItem onSelect={() => run(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" /> Cambiar a tema claro
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" /> Cambiar a tema oscuro
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
