import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { LeadLabelChart } from "@/components/dashboard/LeadLabelChart";
import { LeadLabelSummary } from "@/components/dashboard/LeadLabelSummary";
import { HotLeadsTable } from "@/components/dashboard/HotLeadsTable";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { tenantId } = useAuth();
  const {
    loading,
    totalLeads,
    leadsToday,
    hotLeadsUnreplied,
    labelDistribution,
    hotLeads,
    hotCount,
    warmCount,
    coldCount,
    convertedCount,
    totalWeek,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (totalLeads === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview real-time bisnis properti Anda</p>
        </div>
        <DashboardStats totalLeads={0} leadsToday={0} hotLeadsUnreplied={0} convertedCount={0} />
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium">Belum ada data lead</p>
          <p className="text-sm mt-1">Data akan muncul saat lead mulai masuk melalui WhatsApp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview real-time bisnis properti Anda</p>
      </div>

      <DashboardStats
        totalLeads={totalLeads}
        leadsToday={leadsToday}
        hotLeadsUnreplied={hotLeadsUnreplied}
        convertedCount={convertedCount}
      />

      <LeadLabelChart data={labelDistribution} totalWeek={totalWeek} />

      <LeadLabelSummary hot={hotCount} warm={warmCount} cold={coldCount} />

      <HotLeadsTable leads={hotLeads} />

      <RecentActivity tenantId={tenantId} />
    </div>
  );
}
