import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const { tenantUser } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        {tenantUser && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Tenant: <span className="font-medium text-foreground">{tenantUser.tenant_id}</span>
          </span>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}
