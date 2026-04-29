import { useState } from "react";
import { Users, Flame, CheckCircle2, Plus, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAgentsData } from "@/hooks/useAgentsData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddAgentDialog from "@/components/agents/AddAgentDialog";

const roleLabel: Record<string, string> = {
  admin_developer: "Admin Developer",
  admin_agent: "Admin Agent",
  agent: "Agent",
};

export default function Agents() {
  const { role } = useAuth();
  const canManage = role === "admin_agent" || role === "admin_developer";
  const { loading, agents, error, reload } = useAgentsData();
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const totalAgents = agents.filter((a) => a.role === "agent").length;
  const activeAgents = agents.filter((a) => a.role === "agent" && a.is_active).length;
  const totalLeadsAll = agents.reduce((sum, a) => sum + a.totalLeads, 0);

  const handleToggleActive = async (agentId: number, nextActive: boolean) => {
    setBusyId(agentId);
    try {
      const { data, error } = await supabase.functions.invoke("deactivate-agent", {
        body: { agent_id: agentId, is_active: nextActive },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(nextActive ? "Agent diaktifkan" : "Agent dinonaktifkan");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Agent</h1>
          <p className="text-muted-foreground text-sm">
            Daftar agent dalam tenant Anda beserta performa singkat.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Agent
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Agent" value={totalAgents} color="text-primary" />
        <StatCard icon={CheckCircle2} label="Agent Aktif" value={activeAgents} color="text-emerald-500" />
        <StatCard icon={Flame} label="Total Leads Ditangani" value={totalLeadsAll} color="text-orange-500" />
      </div>

      {/* Table */}
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
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : agents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Belum ada agent di tenant ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WA Session</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Hot</TableHead>
                    <TableHead className="text-right">Converted</TableHead>
                    {canManage && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{a.email}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {a.wa_session ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel[a.role] ?? a.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {a.is_active ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Nonaktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{a.totalLeads}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-500">{a.hotLeads}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600">
                        {a.convertedLeads}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {a.role === "agent" ? (
                            a.is_active ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    disabled={busyId === a.id}
                                  >
                                    <Power className="h-3.5 w-3.5 mr-1" />
                                    Nonaktifkan
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Nonaktifkan agent?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      <strong>{a.name}</strong> tidak akan bisa login & sesi WA-nya dinonaktifkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleToggleActive(a.id, false)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Nonaktifkan
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(a.id, true)}
                                disabled={busyId === a.id}
                              >
                                Aktifkan
                              </Button>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} onCreated={reload} />
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof Users; label: string; value: number; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
