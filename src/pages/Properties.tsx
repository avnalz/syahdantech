import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyFormDialog } from "@/components/properties/PropertyFormDialog";
import type { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;

export default function Properties() {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

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

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Properti dihapus" });
      fetchProperties();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Properti</h1>
          <p className="text-muted-foreground text-sm">Kelola daftar properti Anda</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Properti
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Belum ada properti. Tambahkan properti pertama Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
