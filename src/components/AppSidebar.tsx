import { LayoutDashboard, MessageSquare, Building2, Bot, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHotLeadBadge } from "@/hooks/useHotLeadBadge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads & Inbox", url: "/leads", icon: MessageSquare, badge: true },
  { title: "Properti", url: "/properties", icon: Building2 },
  { title: "AI Manager", url: "/ai-manager", icon: Bot },
  { title: "Pengaturan", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, tenantUser } = useAuth();
  const hotCount = useHotLeadBadge();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="flex items-center gap-2 text-primary font-bold text-base">
                <Building2 className="h-5 w-5" />
                PropCRM
              </span>
            )}
            {collapsed && <Building2 className="h-5 w-5 text-primary" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/50"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {item.badge && hotCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
                          {hotCount}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && tenantUser && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium truncate">{tenantUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{tenantUser.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
