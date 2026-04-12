import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LabelChartProps {
  data: { date: string; cold: number; warm: number; hot: number }[];
}

export function LeadLabelChart({ data }: LabelChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribusi Label Lead (7 Hari)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend />
              <Bar dataKey="cold" name="Cold" fill="hsl(210, 80%, 55%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="warm" name="Warm" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="hot" name="Hot" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
