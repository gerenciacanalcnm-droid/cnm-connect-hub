import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Toaster } from "@/components/ui/sonner";
import { CompanyProvider } from "@/context/company-context";
import { availableCompanies } from "@/config/companies.available";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_admin" as never)({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <CompanyProvider initial={availableCompanies[0]} available={availableCompanies}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AdminSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/[0.04] via-background to-background px-4 py-2.5 backdrop-blur-md">
              <Breadcrumbs />
              <div className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary sm:flex">
                <Shield className="h-3 w-3" /> Super Admin
              </div>
            </div>
            <main className="flex-1 bg-surface/40">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </CompanyProvider>
  );
}
