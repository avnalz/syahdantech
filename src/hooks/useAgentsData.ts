import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AgentRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  totalLeads: number;
  hotLeads: number;
  convertedLeads: number;
}

export function useAgentsData() {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: users, error: usersErr } = await supabase
          .from("users")
          .select("id, name, email, phone, role, is_active, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (usersErr) throw usersErr;

        const { data: contacts, error: contactsErr } = await supabase
          .from("contacts")
          .select("assigned_to, lead_label, pipeline_stage")
          .eq("tenant_id", tenantId);

        if (contactsErr) throw contactsErr;

        const stats = new Map<number, { total: number; hot: number; converted: number }>();
        (contacts ?? []).forEach((c) => {
          if (!c.assigned_to) return;
          const cur = stats.get(c.assigned_to) ?? { total: 0, hot: 0, converted: 0 };
          cur.total += 1;
          if (c.lead_label === "hot") cur.hot += 1;
          if (c.pipeline_stage === "converted" || c.pipeline_stage === "deal") cur.converted += 1;
          stats.set(c.assigned_to, cur);
        });

        const rows: AgentRow[] = (users ?? []).map((u) => {
          const s = stats.get(u.id) ?? { total: 0, hot: 0, converted: 0 };
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            is_active: u.is_active,
            created_at: u.created_at,
            totalLeads: s.total,
            hotLeads: s.hot,
            convertedLeads: s.converted,
          };
        });

        setAgents(rows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Gagal memuat data agent";
        setError(msg);
        console.error("[useAgentsData]", e);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [tenantId]);

  return { loading, agents, error };
}
