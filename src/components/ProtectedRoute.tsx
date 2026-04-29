import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** Jika di-set, hanya role berikut yang boleh masuk. */
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, tenantUser, tenantId, role, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!tenantUser || !tenantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Akses tenant tidak ditemukan</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Akun Anda belum terhubung ke tenant manapun. Hubungi administrator.
          </p>
        </div>
        <Button variant="outline" onClick={() => signOut()}>Keluar</Button>
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold">Akses ditolak</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Halaman ini tidak tersedia untuk role Anda.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
