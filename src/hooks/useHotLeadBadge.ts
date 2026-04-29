import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHotLeadBadge() {
  const { tenantId, role, currentUserRowId } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!tenantId) return;

    const fetch = async () => {
      // Untuk agent: hot lead dalam 1 jam terakhir, di-assign ke dirinya.
      // Untuk admin: hot lead yang sudah > 24 jam belum dibalas (existing behavior).
      let query = supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("lead_label", "hot");

      if (role === "agent" && currentUserRowId != null) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        query = query.eq("assigned_to", currentUserRowId).gte("last_chat_at", oneHourAgo);
      } else {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query.lt("last_chat_at", twentyFourHoursAgo);
      }

      const { count: c } = await query;
      setCount(c || 0);
    };

    fetch();

    const channel = supabase
      .channel(`hot-lead-badge-${tenantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts", filter: `tenant_id=eq.${tenantId}` }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId, role, currentUserRowId]);

  return count;
}
