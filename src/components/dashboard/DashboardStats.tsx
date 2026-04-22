import { Flame, Clock, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  totalLeads: number;
  leadsToday: number;
  hotCount: number;
  convertedCount: number;
  conversionRate: number;
}

export function DashboardStats({ totalLeads, leadsToday, hotCount, convertedCount, conversionRate }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Primary card */}
      <Card className="bg-primary text-primary-foreground border-primary">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-xs font-medium mb-1">
            <span>📊</span> Hari ini
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{leadsToday}</p>
          <p className="text-xs sm:text-sm text-primary-foreground/70 mt-0.5">Leads baru</p>
        </CardContent>
      </Card>

      {/* Hot */}
      <Card>
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
            <Flame className="h-3.5 w-3.5 text-destructive" /> HOT
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{hotCount}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Hot Leads</p>
        </CardContent>
      </Card>

      {/* Follow-up */}
      <Card>
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5 text-warning" /> Follow-up
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{totalLeads - convertedCount}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Perlu ditindak</p>
        </CardContent>
      </Card>

      {/* Conversion rate */}
      <Card>
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
            <Target className="h-3.5 w-3.5 text-primary" /> Conversion
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{conversionRate}%</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{convertedCount} converted</p>
        </CardContent>
      </Card>
    </div>
  );
}
