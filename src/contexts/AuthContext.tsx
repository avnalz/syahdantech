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
      .select("id, name, tenant_type")
      .eq("id", tenantId)
      .maybeSingle();

    if (error) {
      console.warn("[Auth] tenants query error:", error.message);
    }
    setTenant(data ?? { id: tenantId, name: `Tenant ${tenantId}` });
  };

  const loadProfile = async (authUser: User) => {
    console.log("[Auth] loading profile for:", authUser.email);

    // Single source of truth: public.users (linked via auth_user_id)
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id, tenant_id, role, name, email")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (userError || !userRow) {
      console.warn("[Auth] no users row found:", userError?.message);
      setTenantUser(null);
      setTenant(null);
      return;
    }

    const tenantId = Number(userRow.tenant_id);
    const role = (userRow.role as AppRole) ?? "agent";
    const userName = userRow.name ?? authUser.email ?? "";

    console.log("[Auth] FINAL role:", role, "tenant:", tenantId);

    setTenantUser({
      id: authUser.id,
      name: userName,
      email: authUser.email ?? "",
      tenant_id: tenantId,
      role,
      user_row_id: userRow.id,
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
