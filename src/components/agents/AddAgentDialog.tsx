import { useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export default function AddAgentDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [phone, setPhone] = useState("");
  const [waSession, setWaSession] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(""); setEmail(""); setPassword(""); setPhone(""); setWaSession(""); setShowPwd(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password || !waSession.trim()) {
      toast.error("Lengkapi field wajib"); return;
    }
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter"); return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-agent", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || null,
          wa_session: waSession.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Agent berhasil ditambahkan");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menambah agent";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Tambah Agent
          </DialogTitle>
          <DialogDescription>
            Buat akun agent baru di tenant Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ag-name">Nama Lengkap *</Label>
            <Input id="ag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Budi Santoso" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-email">Email *</Label>
            <Input id="ag-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@contoh.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-pwd">Password * <span className="text-xs text-muted-foreground">(min 8 karakter)</span></Label>
            <div className="relative">
              <Input
                id="ag-pwd"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPwd ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-phone">No HP</Label>
            <Input id="ag-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+628123…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-wa">WA Session ID *</Label>
            <Input id="ag-wa" value={waSession} onChange={(e) => setWaSession(e.target.value)} placeholder="6281234567890" />
            <p className="text-xs text-muted-foreground">Nomor WA yang akan dipakai agent.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Batal</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Simpan Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
