import { Users, UserPlus, AlertTriangle, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "warning";
}

function StatCard({ title, value, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${
            variant === "warning"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  totalLeads: number;
  leadsToday: number;
  hotLeadsUnreplied: number;
}

export function DashboardStats({ totalLeads, leadsToday, hotLeadsUnreplied }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard title="Total Lead" value={totalLeads} icon={Users} />
      <StatCard title="Lead Hari Ini" value={leadsToday} icon={UserPlus} />
      <StatCard
        title="Hot Lead Belum Dibalas"
        value={hotLeadsUnreplied}
        icon={AlertTriangle}
        variant="warning"
      />
    </div>
  );
}
