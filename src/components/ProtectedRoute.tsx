import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, tenantUser, tenantId, loading, signOut } = useAuth();
  const location = useLocation();

  // 1. Auth still resolving
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
      </div>
    );
  }

  // 2. Not authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Authenticated but tenant lookup failed (no row in users_safe / no tenant_id)
  if (!tenantUser || !tenantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Akses tenant tidak ditemukan</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Akun Anda belum terhubung ke tenant manapun. Hubungi administrator untuk diaktifkan.
          </p>
        </div>
        <Button variant="outline" onClick={() => signOut()}>
          Keluar
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
