import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Users, Target, TrendingUp } from "lucide-react";

interface AgentRow {
  id: number;
  name: string;
  email: string;
  totalLeads: number;
  hot: number;
  warm: number;
  cold: number;
  converted: number;
  conversionRate: number;
}

export function AgentBreakdown() {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId) return;
      setLoading(true);

      const [usersRes, contactsRes] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, email, role, is_active")
          .eq("tenant_id", tenantId),
        supabase
          .from("contacts")
          .select("assigned_to, lead_label, pipeline_stage")
          .eq("tenant_id", tenantId),
      ]);

      if (usersRes.error) console.error("[AgentBreakdown] users error:", usersRes.error);
      if (contactsRes.error) console.error("[AgentBreakdown] contacts error:", contactsRes.error);

      const allUsers = usersRes.data || [];
      console.log("[AgentBreakdown] users fetched:", allUsers.length, allUsers);

      const agentUsers = allUsers.filter(
        (u) => u.is_active !== false && u.role !== "admin_developer"
      );
      const allContacts = contactsRes.data || [];

      const rows: AgentRow[] = agentUsers.map((u) => {
        const own = allContacts.filter((c) => c.assigned_to === u.id);
        const hot = own.filter((c) => c.lead_label === "hot").length;
        const warm = own.filter((c) => c.lead_label === "warm").length;
        const cold = own.filter((c) => c.lead_label === "cold").length;
        const converted = own.filter(
          (c) =>
            c.pipeline_stage === "won" ||
            c.pipeline_stage === "closed_won" ||
            c.pipeline_stage === "converted"
        ).length;
        const conversionRate =
          own.length > 0 ? Math.round((converted / own.length) * 100) : 0;
        return {
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          totalLeads: own.length,
          hot,
          warm,
          cold,
          converted,
          conversionRate,
        };
      });

      rows.sort((a, b) => b.totalLeads - a.totalLeads);
      setAgents(rows);
      setLoading(false);
    };

    void fetchData();
  }, [tenantId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performa per Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performa per Agent</CardTitle>
        <p className="text-xs text-muted-foreground">
          Ringkasan dashboard tiap agent ({agents.length} agent)
        </p>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Belum ada agent aktif
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.email}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat
                    icon={<Users className="h-3.5 w-3.5" />}
                    label="Total"
                    value={a.totalLeads}
                  />
                  <Stat
                    icon={<Flame className="h-3.5 w-3.5 text-destructive" />}
                    label="Hot"
                    value={a.hot}
                  />
                  <Stat
                    icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                    label="Closing"
                    value={a.converted}
                  />
                  <Stat
                    icon={<Target className="h-3.5 w-3.5 text-primary" />}
                    label="Conv"
                    value={`${a.conversionRate}%`}
                  />
                </div>

                <div className="flex gap-1.5 text-[10px] font-semibold">
                  <span className="flex-1 text-center py-1 rounded bg-red-500/15 text-red-600 dark:text-red-400">
                    HOT {a.hot}
                  </span>
                  <span className="flex-1 text-center py-1 rounded bg-warning/15 text-warning">
                    WARM {a.warm}
                  </span>
                  <span className="flex-1 text-center py-1 rounded bg-muted text-muted-foreground">
                    COLD {a.cold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}
