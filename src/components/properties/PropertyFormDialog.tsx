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
import { toast } from "sonner";
import type { Property } from "@/pages/Properties";

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  tenantId: number | null;
  onSaved: () => void;
}

export function PropertyFormDialog({ open, onOpenChange, property, tenantId, onSaved }: PropertyFormDialogProps) {
  
  const [saving, setSaving] = useState(false);

  const [kode, setKode] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [harga, setHarga] = useState("");
  const [area, setArea] = useState("");
  const [luasTanah, setLuasTanah] = useState("");
  const [luasBangunan, setLuasBangunan] = useState("");
  const [kamar, setKamar] = useState("");
  const [kamarMandi, setKamarMandi] = useState("");
  const [legalitas, setLegalitas] = useState("");
  const [stok, setStok] = useState("1");
  const [status, setStatus] = useState("available");
  const [imgUrl, setImgUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (property) {
      const p = property as Property & { description?: string | null; kamar_mandi?: string | null; luas_bangunan?: string | null };
      setKode(p.kode || "");
      setLokasi(p.lokasi || "");
      setHarga(p.harga?.toString() || "");
      setArea(p.area || "");
      setLuasTanah(p.luas_tanah || "");
      setLuasBangunan(p.luas_bangunan || "");
      setKamar(p.kamar || "");
      setKamarMandi(p.kamar_mandi || "");
      setLegalitas(p.legalitas || "");
      setStok(p.stok?.toString() || "1");
      setStatus(p.status || "available");
      setImgUrl(p.img_url || "");
      setDescription(p.description || "");
    } else {
      setKode(""); setLokasi(""); setHarga(""); setArea(""); setLuasTanah(""); setLuasBangunan("");
      setKamar(""); setKamarMandi(""); setLegalitas(""); setStok("1"); setStatus("available"); setImgUrl(""); setDescription("");
    }
  }, [property, open]);

  const convertGDriveLink = (url: string): string => {
    // Extract file ID from various Google Drive URL formats
    let fileId = "";
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        fileId = match[1];
        break;
      }
    }
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return url;
  };

  const handleGDriveLink = () => {
    if (!imgUrl.trim()) return;
    const directUrl = convertGDriveLink(imgUrl.trim());
    setImgUrl(directUrl);
    toast.success("Link dikonversi ke direct URL");
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
      luas_bangunan: luasBangunan || null,
      kamar: kamar || null,
      kamar_mandi: kamarMandi || null,
      legalitas: legalitas || null,
      stok: parseInt(stok, 10) || 0,
      status,
      img_url: imgUrl || null,
      description: description || null,
      tenant_id: tenantId,
    };

    let error;
    if (property) {
      ({ error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", property.id)
        .eq("tenant_id", tenantId));
    } else {
      ({ error } = await supabase.from("properties").insert(payload));
    }

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success(property ? "Properti diperbarui" : "Properti ditambahkan");
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 [&>button]:top-3 [&>button]:right-3 border px-[16px] ml-[30px] mr-[30px] mx-0 my-0 py-[16px] border-none rounded-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base sm:text-lg">{property ? "Edit Properti" : "Tambah Properti"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-1 sm:mt-2 [&_label]:text-xs sm:[&_label]:text-sm [&_input]:h-9 sm:[&_input]:h-10 [&_input]:text-sm">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="kode">Kode</Label>
              <Input id="kode" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="A-01" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="lokasi">Lokasi *</Label>
              <Input id="lokasi" value={lokasi} onChange={(e) => setLokasi(e.target.value)} required placeholder="Canggu, Bali" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="harga">Harga (Rp)</Label>
              <Input id="harga" type="number" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="500000000" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Canggu" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="luasTanah">Luas Tanah</Label>
              <Input id="luasTanah" value={luasTanah} onChange={(e) => setLuasTanah(e.target.value)} placeholder="100 m²" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="luasBangunan">Luas Bangunan</Label>
              <Input id="luasBangunan" value={luasBangunan} onChange={(e) => setLuasBangunan(e.target.value)} placeholder="80 m²" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="kamar">Kamar Tidur</Label>
              <Input id="kamar" value={kamar} onChange={(e) => setKamar(e.target.value)} placeholder="3" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="kamarMandi">Kamar Mandi</Label>
              <Input id="kamarMandi" value={kamarMandi} onChange={(e) => setKamarMandi(e.target.value)} placeholder="2" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="stok">Stok</Label>
              <Input id="stok" type="number" value={stok} onChange={(e) => setStok(e.target.value)} placeholder="1" />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="legalitas">Legalitas</Label>
            <Input id="legalitas" value={legalitas} onChange={(e) => setLegalitas(e.target.value)} placeholder="SHM / HGB" />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan keunggulan, fasilitas, lingkungan sekitar..."
              rows={3}
              className="text-sm min-h-[72px] sm:min-h-[96px]"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="sold">Terjual</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label>Foto Properti (Link Google Drive)</Label>
            {imgUrl && !imgUrl.startsWith("https://drive.google.com") && (
              <img src={imgUrl} alt="Preview" className="w-full h-24 sm:h-32 object-cover rounded-md mb-2" />
            )}
            <div className="flex gap-2">
              <Input
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <Button type="button" variant="outline" size="sm" onClick={handleGDriveLink} className="shrink-0 h-9 sm:h-10">
                Konversi
              </Button>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Paste link Google Drive lalu klik Konversi</p>
          </div>

          <div className="flex justify-end gap-2 pt-1 sm:pt-2">
            <Button type="button" variant="outline" size="sm" className="sm:h-10 sm:px-4" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" className="sm:h-10 sm:px-4" disabled={saving || !lokasi.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {property ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
