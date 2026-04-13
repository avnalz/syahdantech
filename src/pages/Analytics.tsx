import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, MessageSquare, TrendingUp, Target, Flame, ThermometerSun, Snowflake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)", "hsl(200, 80%, 55%)"];
const SENTIMENT_COLORS = ["hsl(142, 71%, 45%)", "hsl(220, 14%, 60%)", "hsl(0, 72%, 51%)"];

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <g>
      <text x={x} y={y - 7} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={800} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <text x={x} y={y + 11} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={500} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
        {name}
      </text>
    </g>
  );
};

export default function Analytics() {
  const [monthOffset, setMonthOffset] = useState(0);
  const { loading, summary, dailyLeads, pipelineData, sentimentData, labelData, monthLabel } = useAnalyticsData(monthOffset);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with month nav */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analisis CRM</h1>
          <p className="text-muted-foreground text-sm">Ringkasan performa bulan ini</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonthOffset(o => o + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={summary.totalLeads} color="text-primary" />
        <StatCard icon={TrendingUp} label="Lead Baru" value={summary.newLeadsThisMonth} color="text-emerald-500" />
        <StatCard icon={MessageSquare} label="Percakapan" value={summary.totalConversations} color="text-blue-500" />
        <StatCard icon={Target} label="Rata-rata Skor" value={summary.avgLeadScore} color="text-orange-500" />
      </div>

      {/* Lead Label Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-6 w-6 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{summary.hotLeads}</p>
              <p className="text-xs text-muted-foreground">Hot Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <ThermometerSun className="h-6 w-6 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{summary.warmLeads}</p>
              <p className="text-xs text-muted-foreground">Warm Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Snowflake className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{summary.coldLeads}</p>
              <p className="text-xs text-muted-foreground">Cold Leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Leads Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Baru per Hari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyLeads}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="count" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline + Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Bar dataKey="count" name="Jumlah" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Label Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Label Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={labelData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={3}
                    labelLine={false}
                    label={renderDonutLabel}
                  >
                    {labelData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Donut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sentimen Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  dataKey="count"
                  nameKey="sentiment"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={95}
                  paddingAngle={3}
                  labelLine={false}
                  label={renderDonutLabel}
                >
                  {sentimentData.map((_, i) => (
                    <Cell key={i} fill={SENTIMENT_COLORS[i % SENTIMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
            <p className="text-3xl font-bold">{summary.conversionRate}%</p>
          </div>
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
