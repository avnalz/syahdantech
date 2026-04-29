import { useEffect, useState, useCallback } from "react";
import { Users, Mail, Phone, ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navigate } from "react-router-dom";

interface AgentRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AgentStats {
  leads: number;
  hot: number;
}

export default function Agents() {
  const { tenantId, tenantUser } = useAuth();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [stats, setStats] = useState<Record<number, AgentStats>>({});
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data: users, error } = await supabase
      .from("users_safe" as never)
      .select("id, name, email, phone, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Agents] fetch error:", error);
      setAgents([]);
      setLoading(false);
      return;
    }

    const rows = (users ?? []) as AgentRow[];
    setAgents(rows);

    // Fetch lead counts per agent
    const { data: contacts } = await supabase
      .from("contacts")
      .select("assigned_to, lead_label")
      .eq("tenant_id", tenantId);

    const agg: Record<number, AgentStats> = {};
    (contacts ?? []).forEach((c) => {
      const aid = c.assigned_to;
      if (!aid) return;
      if (!agg[aid]) agg[aid] = { leads: 0, hot: 0 };
      agg[aid].leads += 1;
      if (c.lead_label === "hot") agg[aid].hot += 1;
    });
    setStats(agg);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Guard: hanya admin_developer
  if (tenantUser && tenantUser.role !== "admin_developer") {
    return <Navigate to="/" replace />;
  }

  const roleLabel = (role: string) => {
    if (role === "admin_developer") return { label: "Developer", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" };
    if (role === "admin_agent") return { label: "Agent Mandiri", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" };
    return { label: "Agent", className: "bg-muted text-muted-foreground hover:bg-muted" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar agent dalam tim Anda dan performa mereka.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{agents.length} agent</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Belum ada agent terdaftar di tenant ini.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Total Leads</TableHead>
                  <TableHead className="text-center">Hot Leads</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a) => {
                  const r = roleLabel(a.role);
                  const s = stats[a.id] ?? { leads: 0, hot: 0 };
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {a.email}
                          </div>
                          {a.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {a.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={r.className}>
                          {r.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{s.leads}</TableCell>
                      <TableCell className="text-center">
                        {s.hot > 0 ? (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{s.hot}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.is_active ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Aktif
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldOff className="h-3.5 w-3.5" />
                            Nonaktif
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
