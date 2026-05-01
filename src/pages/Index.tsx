import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { LeadLabelChart } from "@/components/dashboard/LeadLabelChart";
import { LeadLabelSummary } from "@/components/dashboard/LeadLabelSummary";
import { HotLeadsTable } from "@/components/dashboard/HotLeadsTable";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { tenantId, tenantUser } = useAuth();
  const canOpenAnalytics = tenantUser?.role === "admin_agent" || tenantUser?.role === "admin_developer";
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
    conversionRate,
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview real-time bisnis properti Anda</p>
          </div>
          {canOpenAnalytics && (
            <Button asChild variant="outline" size="sm">
              <Link to="/analytics">
                <BarChart3 className="h-4 w-4" />
                Analisis
              </Link>
            </Button>
          )}
        </div>
        <DashboardStats totalLeads={0} leadsToday={0} hotCount={0} convertedCount={0} conversionRate={0} />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview real-time bisnis properti Anda</p>
        </div>
        {canOpenAnalytics && (
          <Button asChild variant="outline" size="sm">
            <Link to="/analytics">
              <BarChart3 className="h-4 w-4" />
              Analisis
            </Link>
          </Button>
        )}
      </div>

      <DashboardStats
        totalLeads={totalLeads}
        leadsToday={leadsToday}
        hotCount={hotCount}
        convertedCount={convertedCount}
        conversionRate={conversionRate}
      />

      <LeadLabelChart data={labelDistribution} totalWeek={totalWeek} />

      <LeadLabelSummary hot={hotCount} warm={warmCount} cold={coldCount} />

      <HotLeadsTable leads={hotLeads} />

      <RecentActivity tenantId={tenantId} />
    </div>
  );
}
