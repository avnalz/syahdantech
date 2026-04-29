import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHotLeadBadge() {
  const { tenantId, role, currentUserRowId } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!tenantId) return;
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
  }, [tenantId, role, currentUserRowId]);

  useEffect(() => {
    if (!tenantId) return;
    void fetchCount();
  }, [tenantId, fetchCount]);

  useEffect(() => {
    if (!tenantId) return;
    const channelName = `hot-lead-badge-${tenantId}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelName);
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts", filter: `tenant_id=eq.${tenantId}` },
        () => { void fetchCount(); }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return count;
}
