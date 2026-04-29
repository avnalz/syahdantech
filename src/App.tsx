import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Leads from "./pages/Leads";
import AiManager from "./pages/AiManager";
import Properties from "./pages/Properties";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import type { AppRole } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const ProtectedPage = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const ADMINS: AppRole[] = ["admin_agent", "admin_developer"];

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster position="top-right" richColors closeButton />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedPage><Index /></ProtectedPage>} />
                <Route path="/leads" element={<ProtectedPage><Leads /></ProtectedPage>} />
                <Route path="/ai-manager" element={<ProtectedPage allowedRoles={ADMINS}><AiManager /></ProtectedPage>} />
                <Route path="/properties" element={<ProtectedPage><Properties /></ProtectedPage>} />
                <Route path="/analytics" element={<ProtectedPage allowedRoles={["admin_developer"]}><Analytics /></ProtectedPage>} />
                <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
