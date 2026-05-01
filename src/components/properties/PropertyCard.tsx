import { MapPin, Pencil, Trash2, BedDouble, Bath, Maximize2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Property } from "@/pages/Properties";

interface PropertyCardProps {
  property: Property;
  onEdit: (p: Property) => void;
  onDelete: (id: number) => void;
  onToggleActive?: (id: number, isActive: boolean) => void;
  canEdit?: boolean;
}

function formatRupiah(value: number | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function PropertyCard({ property, onEdit, onDelete, onToggleActive, canEdit = true }: PropertyCardProps) {
  const statusColor =
    property.status === "sold"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : "bg-primary/15 text-primary border-primary/30";

  const statusLabel = property.status === "sold" ? "Terjual" : "Tersedia";

  return (
    <Card className="overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 bg-muted">
        {property.img_url ? (
          <img
            src={property.img_url}
            alt={property.kode || property.lokasi}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Tidak ada foto
          </div>
        )}
        <Badge variant="outline" className={`absolute top-3 right-3 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">
              {property.kode || property.lokasi}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{property.lokasi}</span>
            </div>
          </div>
        </div>

        <p className="text-primary font-bold text-lg">{formatRupiah(property.harga)}</p>

        {(property as Property & { description?: string | null }).description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {(property as Property & { description?: string | null }).description}
          </p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground pt-1">
          {property.kamar && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.kamar} KT
            </span>
          )}
          {(property as Property & { kamar_mandi?: string | null }).kamar_mandi && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {(property as Property & { kamar_mandi?: string | null }).kamar_mandi} KM
            </span>
          )}
          {property.luas_tanah && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              LT {property.luas_tanah}
            </span>
          )}
          {(property as Property & { luas_bangunan?: string | null }).luas_bangunan && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              LB {(property as Property & { luas_bangunan?: string | null }).luas_bangunan}
            </span>
          )}
          {property.stok > 0 && <span>Stok: {property.stok}</span>}
        </div>

        {canEdit && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch
                id={`active-${property.id}`}
                checked={property.is_active}
                onCheckedChange={(v) => onToggleActive?.(property.id, v)}
              />
              <Label htmlFor={`active-${property.id}`} className="text-xs cursor-pointer">
                {property.is_active ? "Aktif" : "Nonaktif"}
              </Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(property)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Properti?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Properti <strong>{property.kode || property.lokasi}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(property.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
