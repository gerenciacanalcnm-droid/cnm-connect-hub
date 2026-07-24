import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminNavigation } from "@/config/admin-navigation";
import { Logo } from "@/components/common/logo";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn("flex h-14 items-center gap-2 px-2", collapsed && "justify-center")}>
          <Logo showWordmark={!collapsed} />
          {!collapsed && (
            <Badge variant="outline" className="ml-auto border-primary/40 bg-primary/10 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Shield className="mr-1 h-3 w-3" /> Admin
            </Badge>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-2">
        {adminNavigation.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.to)}
                      tooltip={item.title}
                      className={cn(
                        "h-9 gap-2.5 rounded-md text-sm font-medium",
                        "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
                        "data-[active=true]:shadow-sm",
                      )}
                    >
                      <Link to={item.to}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        {item.badge && !collapsed && (
                          <Badge variant="outline" className="ml-auto h-4 border-amber-500/40 bg-amber-500/10 px-1.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Volver a la plataforma" className="h-9 gap-2.5 rounded-md text-sm font-medium">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Volver a la plataforma</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
