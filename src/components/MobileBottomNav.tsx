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
    <div className="fixed bottom-3 left-3 right-3 z-50">
      <nav className="bg-foreground rounded-[22px] flex items-center justify-around py-1.5 shadow-lg px-0 mx-[10px]">
        {navItems.map((item) => {
          const isActive = item.path === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center gap-0 w-14 h-10 rounded-full transition-all ${
                isActive
                  ? "bg-background text-foreground scale-105 shadow-md -translate-y-0.5"
                  : "text-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[9px] font-medium leading-tight mt-0.5">{item.label}</span>
              {item.badge && hotCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold px-1">
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
