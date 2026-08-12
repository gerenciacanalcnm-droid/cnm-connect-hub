import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  KeyRound,
  MessageSquare,
  DollarSign,
  Package,
  Tag,
  Wallet,
  FileText,
  Settings,
  Send,
  MessageCircle,
  Sparkles,
  Code2,
  History,
  ScrollText,
  Bell,
  CreditCard,
  Plug,
  ToggleLeft,
  Lock,
  Server,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavigation: AdminNavSection[] = [
  {
    label: "General",
    items: [
      { title: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Empresas", to: "/admin/empresas", icon: Building2 },
      { title: "Usuarios", to: "/admin/usuarios", icon: Users },
      { title: "Roles", to: "/admin/roles", icon: Shield },
      { title: "Permisos", to: "/admin/permisos", icon: KeyRound },
    ],
  },
  {
    label: "Comercial",
    items: [
      { title: "Communication", to: "/admin/communication", icon: MessageSquare },
      { title: "Tarifas", to: "/admin/tarifas", icon: DollarSign },
      { title: "Planes", to: "/admin/planes", icon: Package },
      { title: "Promociones", to: "/admin/promociones", icon: Tag },
      { title: "Recargas", to: "/admin/recargas", icon: Wallet },
      { title: "Wallet y Saldos", to: "/admin/wallet", icon: Wallet },
      { title: "Historial Comercial", to: "/admin/historial-comercial", icon: FileText },
    ],
  },
  {
    label: "Contenido",
    items: [{ title: "Landing CMS", to: "/admin/landing-cms", icon: FileText }],
  },
  {
    label: "Configuración",
    items: [
      { title: "General", to: "/admin/config-general", icon: Settings },
      { title: "SMS", to: "/admin/config-sms", icon: Send },
      { title: "WhatsApp", to: "/admin/config-whatsapp", icon: MessageCircle },
      { title: "Inventario WA", to: "/admin/whatsapp-inventory", icon: Server },
      { title: "CNM Nova", to: "/admin/config-nova", icon: Sparkles },
      { title: "API", to: "/admin/config-api", icon: Code2 },
    ],
  },
  {
    label: "Operación",
    items: [
      { title: "Auditoría", to: "/admin/auditoria", icon: History },
      { title: "Logs", to: "/admin/logs", icon: ScrollText },
      { title: "Notificaciones", to: "/admin/notificaciones", icon: Bell },
      { title: "Métodos de Pago", to: "/admin/pagos", icon: CreditCard },
      { title: "Integraciones", to: "/admin/integraciones", icon: Plug },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Feature Flags", to: "/admin/feature-flags", icon: ToggleLeft },
      { title: "Seguridad", to: "/admin/seguridad", icon: Lock },
      { title: "Sistema", to: "/admin/sistema", icon: Server },
    ],
  },
];
