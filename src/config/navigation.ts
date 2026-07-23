import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Zap,
  BarChart3,
  Wallet,
  Code2,
  LifeBuoy,
  Settings,
  Building2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const primaryNavigation: NavSection[] = [
  {
    label: "Plataforma",
    items: [
      {
        title: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        description: "Visión general de tu cuenta",
      },
      {
        title: "Comunicación",
        to: "/comunicacion",
        icon: MessageSquare,
        description: "SMS, campañas y mensajería",
      },
      {
        title: "CRM",
        to: "/crm",
        icon: Users,
        description: "Contactos y segmentos",
      },
      {
        title: "Automatizaciones",
        to: "/automatizaciones",
        icon: Zap,
        description: "Flujos y disparadores",
      },
      {
        title: "Analytics",
        to: "/analytics",
        icon: BarChart3,
        description: "Métricas y reportes",
      },
    ],
  },
  {
    label: "Operaciones",
    items: [
      {
        title: "Finanzas",
        to: "/finanzas",
        icon: Wallet,
        description: "Facturación y consumo",
      },
      {
        title: "API",
        to: "/api",
        icon: Code2,
        description: "Claves y documentación",
      },
      {
        title: "Soporte",
        to: "/soporte",
        icon: LifeBuoy,
        description: "Tickets y ayuda",
      },
    ],
  },
  {
    label: "Cuenta",
    items: [
      {
        title: "Configuración",
        to: "/configuracion",
        icon: Settings,
        description: "Preferencias y equipo",
      },
      {
        title: "Mi Empresa",
        to: "/mi-empresa",
        icon: Building2,
        description: "Datos fiscales y marca",
      },
    ],
  },
];
