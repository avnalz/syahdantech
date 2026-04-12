import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { LeadLabelChart } from "@/components/dashboard/LeadLabelChart";
import { LeadScoreChart } from "@/components/dashboard/LeadScoreChart";
import { HotLeadsTable } from "@/components/dashboard/HotLeadsTable";
import { Loader2 } from "lucide-react";

export default function Index() {
  const {
    loading,
    totalLeads,
    leadsToday,
    hotLeadsUnreplied,
    labelDistribution,
    avgScorePerDay,
    hotLeads,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ringkasan aktivitas lead Anda</p>
      </div>

      <DashboardStats
        totalLeads={totalLeads}
        leadsToday={leadsToday}
        hotLeadsUnreplied={hotLeadsUnreplied}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadLabelChart data={labelDistribution} />
        <LeadScoreChart data={avgScorePerDay} />
      </div>

      <HotLeadsTable leads={hotLeads} />
    </div>
  );
}
