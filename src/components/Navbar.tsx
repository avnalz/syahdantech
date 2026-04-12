import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-bold text-sm text-foreground">PropCRM</span>
          <span className="text-xs text-muted-foreground">Smart Property CRM</span>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
