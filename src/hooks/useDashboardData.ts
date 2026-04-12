import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Contact = Tables<"contacts">;

export function useDashboardData() {
  const { tenantId } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId);

    if (!error && data) {
      setContacts(data);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Realtime subscription
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel("contacts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchContacts]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalLeads = contacts.length;

  const leadsToday = contacts.filter((c) => {
    const chatDate = new Date(c.last_chat_at);
    chatDate.setHours(0, 0, 0, 0);
    return chatDate.getTime() === today.getTime();
  }).length;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hotLeadsUnreplied = contacts.filter(
    (c) =>
      c.lead_label === "hot" &&
      c.mode !== "human" &&
      new Date(c.last_chat_at) < twentyFourHoursAgo
  ).length;

  // Chart data: lead label distribution last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const labelDistribution = last7Days.map((day) => {
    const dayStr = day.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    const dayContacts = contacts.filter((c) => {
      const cd = new Date(c.last_chat_at);
      cd.setHours(0, 0, 0, 0);
      return cd.getTime() === day.getTime();
    });
    return {
      date: dayStr,
      cold: dayContacts.filter((c) => c.lead_label === "cold").length,
      warm: dayContacts.filter((c) => c.lead_label === "warm").length,
      hot: dayContacts.filter((c) => c.lead_label === "hot").length,
    };
  });

  // Chart data: average lead score per day last 7 days
  const avgScorePerDay = last7Days.map((day) => {
    const dayStr = day.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    const dayContacts = contacts.filter((c) => {
      const cd = new Date(c.last_chat_at);
      cd.setHours(0, 0, 0, 0);
      return cd.getTime() === day.getTime();
    });
    const avg =
      dayContacts.length > 0
        ? Math.round(dayContacts.reduce((sum, c) => sum + c.lead_score, 0) / dayContacts.length)
        : 0;
    return { date: dayStr, score: avg };
  });

  // Hot leads for table
  const hotLeads = contacts
    .filter((c) => c.lead_label === "hot")
    .sort((a, b) => new Date(b.last_chat_at).getTime() - new Date(a.last_chat_at).getTime())
    .slice(0, 5);

  return {
    loading,
    totalLeads,
    leadsToday,
    hotLeadsUnreplied,
    labelDistribution,
    avgScorePerDay,
    hotLeads,
  };
}
