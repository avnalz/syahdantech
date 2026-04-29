import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useHotLeadBadge } from "@/hooks/useHotLeadBadge";
import { useAuth } from "@/contexts/AuthContext";
import { RoleBadge } from "@/components/RoleBadge";

export function Navbar() {
  const navigate = useNavigate();
  const { role, tenantUser } = useAuth();
  const hotCount = useHotLeadBadge();

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-bold text-sm text-foreground">PropCRM</span>
          <span className="text-xs text-muted-foreground">Smart Property CRM</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/leads?filter=hot")}
          className="relative"
          aria-label="Hot leads"
        >
          <Bell className="h-4 w-4" />
          {hotCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {hotCount > 9 ? "9+" : hotCount}
            </span>
          )}
        </Button>
        {tenantUser && (
          <div className="hidden sm:flex items-center gap-1.5 px-2">
            <span className="text-xs font-medium truncate max-w-[120px]">{tenantUser.name}</span>
            <RoleBadge role={role} />
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
