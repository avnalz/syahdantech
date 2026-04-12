import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface ActivityItem {
  id: number;
  phone_number: string;
  message: string;
  direction: string;
  created_at: string;
  contact_name?: string;
}

interface RecentActivityProps {
  tenantId: number | null;
}

export function RecentActivity({ tenantId }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    const fetchActivities = async () => {
      const { data } = await supabase
        .from("chat_logs")
        .select("id, phone_number, message, direction, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (data) {
        // Fetch contact names
        const phones = [...new Set(data.map((d) => d.phone_number))];
        const { data: contacts } = await supabase
          .from("contacts")
          .select("phone_number, name")
          .in("phone_number", phones);

        const nameMap = new Map(contacts?.map((c) => [c.phone_number, c.name]) || []);
        setActivities(
          data.map((d) => ({
            ...d,
            contact_name: nameMap.get(d.phone_number) || d.phone_number,
          }))
        );
      }
    };

    fetchActivities();
  }, [tenantId]);

  if (activities.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.map((activity) => (
            <div key={activity.id} className="px-6 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.contact_name}</span>
                  <span className="text-muted-foreground"> — {activity.message.slice(0, 60)}{activity.message.length > 60 ? "..." : ""}</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: id })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
