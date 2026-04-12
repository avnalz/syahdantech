import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHotLeadBadge() {
  const { tenantId } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!tenantId) return;

    const fetch = async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: c } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("lead_label", "hot")
        .lt("last_chat_at", twentyFourHoursAgo);
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
  }, [tenantId]);

  return count;
}
