import { ArrowRight, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 1);
}

function formatBudget(budget: number | null) {
  if (!budget) return null;
  if (budget >= 1_000_000_000) return `Rp ${(budget / 1_000_000_000).toFixed(1)}M`;
  if (budget >= 1_000_000) return `Rp ${(budget / 1_000_000).toFixed(0)}jt`;
  return `Rp ${budget.toLocaleString("id-ID")}`;
}

interface HotLeadsTableProps {
  leads: Tables<"contacts">[];
}

export function HotLeadsTable({ leads }: HotLeadsTableProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" />
            Butuh Perhatian
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {leads.length} leads
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-6">
            Tidak ada hot leads saat ini.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => navigate("/leads?filter=hot")}
                className="w-full flex items-center gap-3 px-3 sm:px-6 py-3 text-left hover:bg-accent/50 transition-colors group"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {getInitials(lead.name || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lead.name || lead.phone_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBudget(lead.budget)}
                    {formatBudget(lead.budget) && " · "}
                    {formatDistanceToNow(new Date(lead.last_chat_at), { addSuffix: true, locale: id })}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
