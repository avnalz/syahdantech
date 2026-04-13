import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, Building2, Bot, BarChart3 } from "lucide-react";
import { useHotLeadBadge } from "@/hooks/useHotLeadBadge";

const navItems = [
  { label: "Home", icon: LayoutDashboard, path: "/" },
  { label: "Leads", icon: MessageSquare, path: "/leads", badge: true },
  { label: "Properties", icon: Building2, path: "/properties" },
  { label: "AI", icon: Bot, path: "/ai-manager" },
  { label: "Settings", icon: BarChart3, path: "/settings" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const hotCount = useHotLeadBadge();

  return (
    <div className="fixed bottom-4 left-3 right-3 z-50">
      <nav className="bg-foreground rounded-[28px] flex items-center justify-around px-2 py-2 shadow-lg">
        {navItems.map((item) => {
          const isActive = item.path === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-full transition-all ${
                isActive
                  ? "bg-background text-foreground scale-110 shadow-md -translate-y-1"
                  : "text-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && hotCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                  {hotCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
