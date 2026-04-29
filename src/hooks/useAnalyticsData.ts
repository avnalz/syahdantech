import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay } from "date-fns";

export interface AnalyticsSummary {
  totalLeads: number;
  newLeadsThisMonth: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  totalConversations: number;
  avgLeadScore: number;
  conversionRate: number;
}

export interface DailyLeadCount {
  date: string;
  count: number;
}

export interface PipelineCount {
  stage: string;
  count: number;
}

export interface SentimentCount {
  sentiment: string;
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export function useAnalyticsData(monthOffset = 0, agentId: number | "all" = "all") {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalLeads: 0, newLeadsThisMonth: 0, hotLeads: 0, warmLeads: 0,
    coldLeads: 0, totalConversations: 0, avgLeadScore: 0, conversionRate: 0,
  });
  const [dailyLeads, setDailyLeads] = useState<DailyLeadCount[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineCount[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentCount[]>([]);
  const [labelData, setLabelData] = useState<LabelCount[]>([]);

  const targetDate = subMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const monthLabel = format(targetDate, "MMMM yyyy");

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const startStr = monthStart.toISOString();
    const endStr = monthEnd.toISOString();

    // Fetch all contacts for this tenant (optionally filtered by agent)
    let allQ = supabase.from("contacts").select("*").eq("tenant_id", tenantId);
    if (agentId !== "all") allQ = allQ.eq("assigned_to", agentId);
    const { data: contacts } = await allQ;

    // Fetch contacts created this month
    let monthQ = supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("created_at", startStr)
      .lte("created_at", endStr);
    if (agentId !== "all") monthQ = monthQ.eq("assigned_to", agentId);
    const { data: newContacts } = await monthQ;

    // Fetch chat logs this month — scoped to agent's contact phones if filtered
    let chatLogs: { id: number; created_at: string; phone_number: string }[] = [];
    if (agentId === "all") {
      const { data } = await supabase
        .from("chat_logs")
        .select("id, created_at, phone_number")
        .eq("tenant_id", tenantId)
        .gte("created_at", startStr)
        .lte("created_at", endStr);
      chatLogs = data ?? [];
    } else {
      const phones = Array.from(new Set((contacts ?? []).map(c => c.phone_number).filter(Boolean)));
      if (phones.length > 0) {
        const { data } = await supabase
          .from("chat_logs")
          .select("id, created_at, phone_number")
          .eq("tenant_id", tenantId)
          .gte("created_at", startStr)
          .lte("created_at", endStr)
          .in("phone_number", phones);
        chatLogs = data ?? [];
      }
    }

    const allContacts = contacts || [];
    const monthContacts = newContacts || [];
    const chats = chatLogs;

    // Summary
    const hot = allContacts.filter(c => c.lead_label === "hot").length;
    const warm = allContacts.filter(c => c.lead_label === "warm").length;
    const cold = allContacts.filter(c => c.lead_label === "cold").length;
    const avgScore = allContacts.length > 0
      ? Math.round(allContacts.reduce((s, c) => s + c.lead_score, 0) / allContacts.length)
      : 0;
    const sold = allContacts.filter(c => c.pipeline_stage === "won" || c.pipeline_stage === "closed_won").length;
    const convRate = allContacts.length > 0 ? Math.round((sold / allContacts.length) * 100) : 0;

    // Unique conversations this month
    const uniquePhones = new Set(chats.map(c => c.phone_number));

    setSummary({
      totalLeads: allContacts.length,
      newLeadsThisMonth: monthContacts.length,
      hotLeads: hot,
      warmLeads: warm,
      coldLeads: cold,
      totalConversations: uniquePhones.size,
      avgLeadScore: avgScore,
      conversionRate: convRate,
    });

    // Daily new leads
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd > new Date() ? new Date() : monthEnd });
    const dailyCounts: DailyLeadCount[] = days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = monthContacts.filter(c => {
        const d = format(new Date(c.created_at), "yyyy-MM-dd");
        return d === dayStr;
      }).length;
      return { date: format(day, "dd MMM"), count };
    });
    setDailyLeads(dailyCounts);

    // Pipeline stages
    const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
    const stageLabels: Record<string, string> = {
      new: "Baru", contacted: "Dihubungi", qualified: "Qualified",
      proposal: "Proposal", negotiation: "Negosiasi",
      won: "Closing", lost: "Gagal",
    };
    const pCounts: PipelineCount[] = stages.map(s => ({
      stage: stageLabels[s] || s,
      count: allContacts.filter(c => c.pipeline_stage === s).length,
    })).filter(p => p.count > 0);
    setPipelineData(pCounts);

    // Sentiment
    const sentiments = ["positive", "neutral", "negative"];
    const sentLabels: Record<string, string> = { positive: "Positif", neutral: "Netral", negative: "Negatif" };
    const sCounts: SentimentCount[] = sentiments.map(s => ({
      sentiment: sentLabels[s] || s,
      count: allContacts.filter(c => c.sentimen === s).length,
    }));
    setSentimentData(sCounts);

    // Labels
    const labels = ["hot", "warm", "cold"];
    const lLabels: Record<string, string> = { hot: "Hot", warm: "Warm", cold: "Cold" };
    const lCounts: LabelCount[] = labels.map(l => ({
      label: lLabels[l] || l,
      count: allContacts.filter(c => c.lead_label === l).length,
    }));
    setLabelData(lCounts);

    setLoading(false);
  }, [tenantId, monthOffset, agentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { loading, summary, dailyLeads, pipelineData, sentimentData, labelData, monthLabel };
}
