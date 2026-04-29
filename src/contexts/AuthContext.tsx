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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantUser: TenantUser | null;
  tenant: TenantInfo | null;
  tenantId: number | null;
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
      .select("id, name")
      .eq("id", tenantId)
      .maybeSingle();

    if (error) {
      console.warn("[Auth] tenants query error:", error.message);
    }
    setTenant(data ?? { id: tenantId, name: `Tenant ${tenantId}` });
  };

  const loadProfile = async (authUser: User) => {
    console.log("[Auth] Step 1 — auth.user.id:", authUser.id, "email:", authUser.email);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name")
      .eq("id", authUser.id)
      .maybeSingle();

    console.log("[Auth] Step 2 — profiles query result:", { profile, error: error?.message });

    if (error) {
      console.error("[Auth] profiles query failed:", error);
      setTenantUser(null);
      setTenant(null);
      return;
    }

    if (!profile) {
      console.warn("[Auth] No profile row found for user", authUser.id);
      setTenantUser(null);
      setTenant(null);
      return;
    }

    const tenantId = Number(profile.tenant_id);
    console.log("[Auth] Step 3 — tenant_id:", tenantId);

    // Use SECURITY DEFINER RPC to reliably fetch own profile (bypasses RLS chicken-and-egg)
    let finalUserRow: { id: number | null; role: string | null; name: string | null } | null = null;

    const { data: rpcRows, error: rpcErr } = await supabase.rpc("current_user_profile" as never);
    console.log("[Auth] current_user_profile RPC:", rpcRows, "error:", rpcErr?.message);

    const rpcRow = rpcRows && Array.isArray(rpcRows) ? (rpcRows[0] as { user_row_id: number; role: string; name: string } | undefined) : undefined;
    if (rpcRow) {
      finalUserRow = { id: rpcRow.user_row_id, role: rpcRow.role, name: rpcRow.name };
    } else {
      // Fallback: direct query (relies on "users: select own row" RLS policy)
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, role, name")
        .eq("email", authUser.email ?? "")
        .maybeSingle();
      console.log("[Auth] direct users fallback:", userRow, "error:", userError?.message);
      finalUserRow = userRow ?? null;
    }

    const role = ((finalUserRow?.role as AppRole) ?? "agent") as AppRole;
    console.log("[Auth] final role:", role, "name:", finalUserRow?.name);

    setTenantUser({
      id: profile.id,
      name: finalUserRow?.name ?? profile.full_name ?? authUser.email ?? "",
      email: authUser.email ?? "",
      tenant_id: tenantId,
      role,
      user_row_id: finalUserRow?.id ?? undefined,
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
