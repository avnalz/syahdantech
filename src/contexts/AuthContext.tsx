import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin_agent" | "admin_developer" | "agent";
export type TenantType = "agent" | "developer";

interface TenantUser {
  id: string;          // profiles.id (= auth.uid)
  userRowId: number | null; // users.id (numeric, dari tabel users)
  name: string;
  email: string;
  tenant_id: number;
  role: AppRole;
}

interface TenantInfo {
  id: number;
  name: string;
  tenant_type: TenantType;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantUser: TenantUser | null;
  tenant: TenantInfo | null;
  tenantId: number | null;
  role: AppRole | null;
  tenantType: TenantType | null;
  currentUserRowId: number | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantInfo = async (tenantId: number) => {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name, tenant_type")
      .eq("id", tenantId)
      .maybeSingle();

    if (error) {
      console.warn("[Auth] tenants query error:", error.message);
    }
    setTenant(
      data
        ? { id: data.id, name: data.name, tenant_type: (data.tenant_type as TenantType) ?? "agent" }
        : { id: tenantId, name: `Tenant ${tenantId}`, tenant_type: "agent" }
    );
  };

  const loadProfile = async (authUser: User) => {
    // 1. profiles → tenant_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("[Auth] profile not found:", profileError?.message);
      setTenantUser(null);
      setTenant(null);
      return;
    }

    const tenantId = Number(profile.tenant_id);

    // 2. users → role + numeric id, scoped by tenant + email
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id, role, name")
      .eq("tenant_id", tenantId)
      .eq("email", authUser.email ?? "")
      .maybeSingle();

    if (userError) {
      console.warn("[Auth] users query error:", userError.message);
    }

    const role = (userRow?.role as AppRole) ?? "agent";

    setTenantUser({
      id: profile.id,
      userRowId: userRow?.id ?? null,
      // Selalu prioritaskan users.name (nama orang). Hindari fallback ke profile.full_name
      // karena field tersebut sering berisi nama bisnis dari registrasi awal.
      name: userRow?.name?.trim() || (authUser.email?.split("@")[0] ?? ""),
      email: authUser.email ?? "",
      tenant_id: tenantId,
      role,
    });
    await fetchTenantInfo(tenantId);
  };

  const refreshTenant = async () => {
    if (user) await loadProfile(user);
  };

  useEffect(() => {
    let isMounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await loadProfile(nextSession.user);
      } else {
        setTenantUser(null);
        setTenant(null);
      }
      if (isMounted) setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => { void applySession(nextSession); }, 0);
    });

    void supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      void applySession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTenantUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        tenantUser,
        tenant,
        tenantId: tenantUser?.tenant_id ?? null,
        role: tenantUser?.role ?? null,
        tenantType: tenant?.tenant_type ?? null,
        currentUserRowId: tenantUser?.userRowId ?? null,
        loading,
        signIn,
        signOut,
        refreshTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
