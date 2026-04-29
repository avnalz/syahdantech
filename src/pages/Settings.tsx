import { useState, useEffect } from "react";
import { Loader2, Building2, Mail, Lock, Bell, CreditCard, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DripFollowupTab from "@/components/settings/DripFollowupTab";

export default function Settings() {
  const { user, tenantId, tenantUser, tenant, refreshTenant } = useAuth();
  const role = tenantUser?.role ?? "agent";
  const isAgent = role === "agent";
  const isDeveloper = role === "admin_developer";
  const planLabel = isDeveloper ? "Pro Plan" : "Starter Plan";
  const [activeAgentCount, setActiveAgentCount] = useState<number | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [notifHotLead, setNotifHotLead] = useState(() => localStorage.getItem("notif_hot_lead") !== "false");
  const [notifUnreplied, setNotifUnreplied] = useState(() => localStorage.getItem("notif_unreplied") !== "false");

  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantId) { setLoading(false); return; }
      const { data } = await supabase
        .from("tenants")
        .select("name, created_at")
        .eq("id", tenantId)
        .maybeSingle();
      if (data) {
        setTenantName(data.name);
        setJoinDate(new Date(data.created_at).toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric",
        }));
      }
      setLoading(false);
    };
    fetchTenant();
  }, [tenantId]);

  // Fetch active agent count for developers
  useEffect(() => {
    if (!tenantId || !isDeveloper) return;
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "agent")
      .eq("is_active", true)
      .then(({ count }) => setActiveAgentCount(count ?? 0));
  }, [tenantId, isDeveloper]);

  // Keep input in sync when global tenant updates
  useEffect(() => {
    if (tenant?.name) setTenantName(tenant.name);
  }, [tenant?.name]);

  const handleSaveTenantName = async () => {
    if (!tenantId || !tenantName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("tenants").update({ name: tenantName.trim() }).eq("id", tenantId);
    if (error) {
      toast.error("Gagal menyimpan nama");
    } else {
      await refreshTenant();
      toast.success("Profil berhasil disimpan ✓");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    if (newPassword !== confirmPassword) { toast.error("Password tidak cocok"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error("Gagal mengganti password"); } else {
      toast.success("Password berhasil diubah");
      setNewPassword(""); setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const handleToggleNotif = (key: string, value: boolean) => {
    localStorage.setItem(key, String(value));
    if (key === "notif_hot_lead") setNotifHotLead(value);
    if (key === "notif_unreplied") setNotifUnreplied(value);
    toast.success("Pengaturan disimpan");
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Konfigurasi & preferensi <Settings2 className="h-3 w-3" />
        </p>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="drip">Drip Follow-up</TabsTrigger>
          <TabsTrigger value="notifikasi">Notifikasi</TabsTrigger>
          <TabsTrigger value="tentang">Tentang</TabsTrigger>
        </TabsList>

        {/* Profil Tab */}
        <TabsContent value="profil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Profil Bisnis
              </CardTitle>
              <CardDescription>Informasi dasar tentang bisnis Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Nama Agency / Developer</Label>
                <div className="flex gap-2">
                  <Input id="tenantName" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Nama bisnis Anda" />
                  <Button onClick={handleSaveTenantName} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Admin
                </Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Ganti Password
                </Label>
                <Input type="password" placeholder="Password baru" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input type="password" placeholder="Konfirmasi password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Button variant="outline" onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
                  {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Ubah Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drip Follow-up Tab */}
        <TabsContent value="drip">
          <DripFollowupTab />
        </TabsContent>

        {/* Notifikasi Tab */}
        <TabsContent value="notifikasi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notifikasi
              </CardTitle>
              <CardDescription>Atur notifikasi yang ingin Anda terima</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifikasi Hot Lead</p>
                  <p className="text-xs text-muted-foreground">Ketika label lead berubah menjadi "hot"</p>
                </div>
                <Switch checked={notifHotLead} onCheckedChange={(v) => handleToggleNotif("notif_hot_lead", v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Lead Belum Dibalas 24 Jam</p>
                  <p className="text-xs text-muted-foreground">Notifikasi jika ada lead yang belum direspons</p>
                </div>
                <Switch checked={notifUnreplied} onCheckedChange={(v) => handleToggleNotif("notif_unreplied", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tentang Tab */}
        <TabsContent value="tentang">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Informasi Paket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paket Saat Ini</span>
                <span className="text-sm font-semibold text-primary">Pro Plan</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tanggal Bergabung</span>
                <span className="text-sm font-medium">{joinDate || "—"}</span>
              </div>
              {tenantUser && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tenant ID</span>
                    <span className="text-sm font-medium">{tenantUser.tenant_id}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
