import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NotificationCenter } from "@/components/layout/notification-center";
import { CommandPalette } from "@/components/layout/command-palette";
import { NovaDrawer } from "@/components/layout/nova-drawer";
import { Toaster } from "@/components/ui/sonner";
import { CompanyProvider } from "@/context/company-context";
import { availableCompanies } from "@/config/companies.available";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <CompanyProvider initial={availableCompanies[0]} available={availableCompanies}>
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
