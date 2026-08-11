import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NotificationCenter } from "@/components/layout/notification-center";
import { CommandPalette } from "@/components/layout/command-palette";
import { NovaDrawer } from "@/components/layout/nova-drawer";
import { Toaster } from "@/components/ui/sonner";
import { CompanyProvider } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  // Bypass loading check for diagnostic
  // if (loading || !user) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-background">
  //       <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  //     </div>
  //   );
  // }

  return (
    <CompanyProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <div className="border-b border-border bg-background/60 px-4 py-2.5 backdrop-blur-md">
              <Breadcrumbs />
            </div>
            <main className="flex-1 bg-surface/40">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        <NotificationCenter />
        <CommandPalette />
        <NovaDrawer />
        <Toaster />
      </SidebarProvider>
    </CompanyProvider>
  );
}
