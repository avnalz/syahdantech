import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantUser: TenantUser | null;
  tenantId: number | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantUser = async (email: string) => {
    const { data, error } = await supabase
      .from("users_safe")
      .select("id, name, email, role, tenant_id")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      setTenantUser(data);
    } else {
      setTenantUser(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.email) {
          await fetchTenantUser(session.user.email);
        } else {
          setTenantUser(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        fetchTenantUser(session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTenantUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        tenantUser,
        tenantId: tenantUser?.tenant_id ?? null,
        loading,
        signIn,
        signOut,
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
