import { useState, useEffect, useCallback } from "react";
import { Plus, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyFormDialog } from "@/components/properties/PropertyFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;

export default function Properties() {
  const { tenantId, tenantUser } = useAuth();
  const canEdit = tenantUser?.role === "admin_agent" || tenantUser?.role === "admin_developer";
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchProperties = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (data) setProperties(data);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleDelete = async (id: number) => {
    if (!tenantId) return;
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);
    if (error) {
      toast.error("Gagal menghapus properti");
    } else {
      toast.success("Properti dihapus");
      fetchProperties();
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    if (!tenantId) return;
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)));
    const { error } = await supabase
      .from("properties")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("tenant_id", tenantId);
    if (error) {
      toast.error("Gagal mengubah status");
      fetchProperties();
    } else {
      toast.success(isActive ? "Properti diaktifkan" : "Properti dinonaktifkan");
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProperty(null);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditingProperty(null);
    fetchProperties();
  };

  // Get unique areas
  const areas = [...new Set(properties.map((p) => p.area).filter(Boolean))] as string[];

  // Filter
  const filtered = properties.filter((p) => {
    if (filterArea !== "all" && p.area !== filterArea) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-muted-foreground text-sm">Kelola listing properti Anda</p>
        </div>
        {canEdit && (
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Properti
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Area</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="available">Tersedia</SelectItem>
            <SelectItem value="sold">Terjual</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium">Belum ada properti</p>
          <p className="text-sm mt-1">Tambahkan properti pertama Anda untuk mulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      <PropertyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={editingProperty}
        tenantId={tenantId}
        onSaved={handleSaved}
      />
    </div>
  );
}
