import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

interface AgentRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  wa_session: string | null;
  active_wa_session: string | null;
  created_at: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  wa_session: string;
}

const emptyForm: FormState = { name: "", email: "", password: "", phone: "", wa_session: "" };

export default function Agents() {
  const { tenantUser } = useAuth();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AgentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-agents", {
      body: { action: "list" },
    });
    if (error) {
      console.error("[Agents] list error:", error);
      toast.error("Gagal memuat daftar agent");
      setAgents([]);
    } else {
      setAgents((data?.agents ?? []) as AgentRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantUser?.role === "admin_developer") {
      void fetchAgents();
    }
  }, [fetchAgents, tenantUser]);

  if (tenantUser && tenantUser.role !== "admin_developer") {
    return <Navigate to="/" replace />;
  }

  const updateForm = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const formatWaSession = (v: string) =>
    v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const validate = (): string | null => {
    if (!form.name.trim()) return "Nama wajib diisi";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return "Format email tidak valid";
    if (form.password.length < 8) return "Password minimal 8 karakter";
    if (!form.wa_session.trim()) return "WA Session wajib diisi";
    if (form.phone && !/^62\d{7,14}$/.test(form.phone)) return "Format No HP harus 628xxx";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("manage-agents", {
      body: {
        action: "create",
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        wa_session: form.wa_session.trim(),
      },
    });
    setSubmitting(false);

    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Gagal menambahkan agent");
      return;
    }
    toast.success("Agent berhasil ditambahkan!");
    setDialogOpen(false);
    setForm(emptyForm);
    setShowPassword(false);
    void fetchAgents();
  };

  const handleSetActive = async (agent: AgentRow, makeActive: boolean) => {
    setActionLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-agents", {
      body: { action: "set_active", user_id: agent.id, is_active: makeActive },
    });
    setActionLoading(false);
    setConfirmTarget(null);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Gagal mengubah status");
      return;
    }
    toast.success(makeActive ? "Agent diaktifkan" : "Agent dinonaktifkan");
    void fetchAgents();
  };

  const openAddDialog = () => {
    setForm(emptyForm);
    setShowPassword(false);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola agent dalam tim Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{agents.length} agent</span>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Agent
          </Button>
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
            <div className="text-center py-12 space-y-4">
              <Users className="h-10 w-10 mx-auto text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Belum ada agent. Tambahkan agent pertama Anda.
              </div>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Agent
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>No HP</TableHead>
                  <TableHead>WA Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.email}</TableCell>
                    <TableCell className="text-muted-foreground">{a.phone ?? "—"}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {a.active_wa_session ?? a.wa_session ?? "—"}
                      </code>
                    </TableCell>
                    <TableCell>
                      {a.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.is_active ? (
                        <Button size="sm" variant="outline" onClick={() => setConfirmTarget(a)}>
                          Nonaktifkan
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleSetActive(a, true)}
                          disabled={actionLoading}
                        >
                          Aktifkan
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Agent Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Agent Baru</DialogTitle>
            <DialogDescription>
              Buat akun agent untuk bergabung dengan tim Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ag-name">Nama Lengkap *</Label>
              <Input
                id="ag-name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Budi Santoso"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-email">Email *</Label>
              <Input
                id="ag-email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="agent@contoh.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-password">Password *</Label>
              <div className="relative">
                <Input
                  id="ag-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-phone">No HP (opsional)</Label>
              <Input
                id="ag-phone"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value.replace(/\D/g, ""))}
                placeholder="628123456789"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-wa">WA Session ID *</Label>
              <Input
                id="ag-wa"
                value={form.wa_session}
                onChange={(e) => updateForm("wa_session", formatWaSession(e.target.value))}
                placeholder="bali-agent-01"
              />
              <p className="text-xs text-muted-foreground">
                Hanya huruf kecil, angka, dan tanda hubung.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm deactivate */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan agent?</AlertDialogTitle>
            <AlertDialogDescription>
              Agent <strong>{confirmTarget?.name}</strong> tidak akan bisa menerima leads
              baru dan WA Session-nya akan dimatikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmTarget) void handleSetActive(confirmTarget, false);
              }}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
