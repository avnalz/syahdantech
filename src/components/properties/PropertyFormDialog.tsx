import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@/pages/Properties";

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  tenantId: number | null;
  onSaved: () => void;
}

export function PropertyFormDialog({ open, onOpenChange, property, tenantId, onSaved }: PropertyFormDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [kode, setKode] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [harga, setHarga] = useState("");
  const [area, setArea] = useState("");
  const [luasTanah, setLuasTanah] = useState("");
  const [kamar, setKamar] = useState("");
  const [legalitas, setLegalitas] = useState("");
  const [stok, setStok] = useState("1");
  const [status, setStatus] = useState("available");
  const [imgUrl, setImgUrl] = useState("");

  useEffect(() => {
    if (property) {
      setKode(property.kode || "");
      setLokasi(property.lokasi || "");
      setHarga(property.harga?.toString() || "");
      setArea(property.area || "");
      setLuasTanah(property.luas_tanah || "");
      setKamar(property.kamar || "");
      setLegalitas(property.legalitas || "");
      setStok(property.stok?.toString() || "1");
      setStatus(property.status || "available");
      setImgUrl(property.img_url || "");
    } else {
      setKode(""); setLokasi(""); setHarga(""); setArea(""); setLuasTanah("");
      setKamar(""); setLegalitas(""); setStok("1"); setStatus("available"); setImgUrl("");
    }
  }, [property, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${tenantId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("property-photos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Gagal upload foto", description: uploadError.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("property-photos").getPublicUrl(fileName);
      setImgUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !lokasi.trim()) return;

    setSaving(true);

    const payload = {
      kode: kode || null,
      lokasi,
      harga: harga ? parseInt(harga, 10) : null,
      area: area || null,
      luas_tanah: luasTanah || null,
      kamar: kamar || null,
      legalitas: legalitas || null,
      stok: parseInt(stok, 10) || 0,
      status,
      img_url: imgUrl || null,
      tenant_id: tenantId,
    };

    let error;
    if (property) {
      ({ error } = await supabase.from("properties").update(payload).eq("id", property.id));
    } else {
      ({ error } = await supabase.from("properties").insert(payload));
    }

    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: property ? "Properti diperbarui" : "Properti ditambahkan" });
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Properti" : "Tambah Properti"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode</Label>
              <Input id="kode" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="A-01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi *</Label>
              <Input id="lokasi" value={lokasi} onChange={(e) => setLokasi(e.target.value)} required placeholder="Canggu, Bali" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="harga">Harga (Rp)</Label>
              <Input id="harga" type="number" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="500000000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Canggu" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="luasTanah">Luas Tanah</Label>
              <Input id="luasTanah" value={luasTanah} onChange={(e) => setLuasTanah(e.target.value)} placeholder="100 m²" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kamar">Kamar</Label>
              <Input id="kamar" value={kamar} onChange={(e) => setKamar(e.target.value)} placeholder="3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stok">Stok</Label>
              <Input id="stok" type="number" value={stok} onChange={(e) => setStok(e.target.value)} placeholder="1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalitas">Legalitas</Label>
            <Input id="legalitas" value={legalitas} onChange={(e) => setLegalitas(e.target.value)} placeholder="SHM / HGB" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="sold">Terjual</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Foto Properti</Label>
            {imgUrl && (
              <img src={imgUrl} alt="Preview" className="w-full h-32 object-cover rounded-md mb-2" />
            )}
            <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
            {uploading && <p className="text-xs text-muted-foreground">Mengupload...</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || !lokasi.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {property ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
