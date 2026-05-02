import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin_agent" | "admin_developer" | "agent";

interface TenantUser {
  id: string;
  name: string;
  email: string;
  tenant_id: number;
  role: AppRole;
  user_row_id?: number;
}

interface TenantInfo {
  id: number;
  name: string;
  tenant_type?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantUser: TenantUser | null;
  tenant: TenantInfo | null;
  tenantId: number | null;
  loading: boolean;
  profileLoaded: boolean;
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
  const [profileLoaded, setProfileLoaded] = useState(false);

  const fetchTenantInfo = async (tenantId: number) => {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("id", tenantId)
      .maybeSingle();

    if (error) {
      console.warn("[Auth] tenants query error:", error.message);
    }
    setTenant(data ?? { id: tenantId, name: `Tenant ${tenantId}` });
  };

  const loadProfile = async (authUser: User) => {
    console.log("[Auth] loading profile for:", authUser.email);

    // Step 1: Ambil profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.warn("[Auth] no profile found:", profileError?.message);
      setTenantUser(null);
      setTenant(null);
      return;
    }

    const tenantId = Number(profile.tenant_id);
    console.log("[Auth] tenant_id:", tenantId);

    // Step 2: Ambil role via RPC SECURITY DEFINER (bypass RLS)
    let userRowId: number | null = null;
    let role: AppRole = "agent";
    let userName = profile.full_name ?? authUser.email ?? "";

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("current_user_profile");
      console.log("[Auth] RPC result:", rpcData, "error:", rpcError?.message);

      if (!rpcError && rpcData) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (row?.role) {
          role = row.role as AppRole;
          userRowId = row.user_row_id ?? null;
          userName = row.name ?? userName;
          console.log("[Auth] role from RPC:", role);
        }
      }
    } catch (e) {
      console.warn("[Auth] RPC threw:", e);
    }

    // Step 3: Fallback — query langsung jika RPC tidak menghasilkan role
    if (role === "agent" && !userRowId) {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, role, name")
        .eq("email", authUser.email ?? "")
        .maybeSingle();
      console.log("[Auth] direct query fallback:", userRow, "error:", userError?.message);

      if (!userError && userRow) {
        role = (userRow.role as AppRole) ?? "agent";
        userRowId = userRow.id ?? null;
        userName = userRow.name ?? userName;
      }
    }

    console.log("[Auth] FINAL role:", role, "userName:", userName);

    setTenantUser({
      id: profile.id,
      name: userName,
      email: authUser.email ?? "",
      tenant_id: tenantId,
      role,
      user_row_id: userRowId ?? undefined,
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
        setProfileLoaded(false);
        await loadProfile(nextSession.user);
        if (isMounted) setProfileLoaded(true);
      } else {
        setTenantUser(null);
        setTenant(null);
        if (isMounted) setProfileLoaded(true);
      }

      if (isMounted) setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        void applySession(nextSession);
      }, 0);
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
        loading,
        profileLoaded,
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
