import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Hide bottom nav when inside a lead conversation on mobile
  // This is controlled by the Leads page itself via query params or state
  const showBottomNav = isMobile;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          {!isMobile && <Navbar />}
          <main className={`flex-1 ${isMobile ? 'p-0' : 'p-6'} overflow-x-hidden max-w-full ${isMobile ? 'pb-20' : ''}`}>
            {children}
          </main>
          {showBottomNav && <MobileBottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}
