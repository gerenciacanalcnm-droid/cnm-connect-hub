import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Toaster } from "@/components/ui/sonner";
import { CompanyProvider } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";
import { Loader2, Shield } from "lucide-react";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (!isSuperAdmin) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isSuperAdmin, navigate]);

  if (loading || !user || !isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <CompanyProvider>
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
