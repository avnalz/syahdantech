import { LayoutDashboard, MessageSquare, Building2, Bot, Settings, LogOut, BarChart3, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { useHotLeadBadge } from "@/hooks/useHotLeadBadge";
import { RoleBadge } from "@/components/RoleBadge";
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

type MenuItem = { title: string; url: string; icon: typeof LayoutDashboard; badge?: boolean; roles: AppRole[] };

const mainMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin_agent", "admin_developer", "agent"] },
  { title: "Leads", url: "/leads", icon: MessageSquare, badge: true, roles: ["admin_agent", "admin_developer", "agent"] },
  { title: "Properties", url: "/properties", icon: Building2, roles: ["admin_agent", "admin_developer", "agent"] },
  { title: "Analisis", url: "/analytics", icon: BarChart3, roles: ["admin_developer"] },
  { title: "AI Manager", url: "/ai-manager", icon: Bot, roles: ["admin_agent", "admin_developer"] },
  { title: "Manajemen Agent", url: "/agents", icon: Users, roles: ["admin_developer"] },
];

const settingsMenuItems: MenuItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin_agent", "admin_developer", "agent"] },
];

export function AppSidebar() {
  const { state, setOpen, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, tenantUser, tenant, user } = useAuth();
  const hotCount = useHotLeadBadge();
  const role = tenantUser?.role;
  const visibleMain = role ? mainMenuItems.filter((m) => m.roles.includes(role)) : [];
  const visibleSettings = role ? settingsMenuItems.filter((m) => m.roles.includes(role)) : settingsMenuItems;

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="px-4 py-5">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-sm text-destructive-foreground">PropCRM</span>
                {tenant && (
                  <p className="text-[11px] text-muted-foreground leading-tight truncate max-w-[120px]">
                    {tenant.name}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* MENU */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      onClick={handleNavClick}
                      className={collapsed ? "hover:bg-transparent" : "hover:bg-accent/50"}
                      activeClassName={collapsed ? "text-foreground font-medium" : "bg-accent text-foreground font-medium"}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* PENGATURAN */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase px-4">
            Pengaturan
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className={collapsed ? "hover:bg-transparent" : "hover:bg-accent/50"}
                      activeClassName={collapsed ? "text-foreground font-medium" : "bg-accent text-foreground font-medium"}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && (tenant || user) && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium truncate">{tenant?.name ?? tenantUser?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? tenantUser?.email ?? ""}</p>
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
