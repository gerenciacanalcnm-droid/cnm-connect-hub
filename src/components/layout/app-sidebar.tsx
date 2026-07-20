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
import { primaryNavigation } from "@/config/navigation";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div
          className={cn(
            "flex h-14 items-center px-2",
            collapsed && "justify-center",
          )}
        >
          <Logo showWordmark={!collapsed} />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-2">
        {primaryNavigation.map((section) => (
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
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
            <p className="text-xs font-semibold text-sidebar-foreground">
              Plan Business
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              12.480 SMS restantes este mes
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sidebar-border">
              <div className="h-full w-2/3 rounded-full gradient-brand" />
            </div>
          </div>
        ) : (
          <div className="mx-auto h-2 w-2 rounded-full bg-primary" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
