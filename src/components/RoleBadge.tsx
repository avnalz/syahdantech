import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/contexts/AuthContext";

const ROLE_META: Record<AppRole, { label: string; className: string }> = {
  admin_agent: {
    label: "Agent Mandiri",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  admin_developer: {
    label: "Developer",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  agent: {
    label: "Agent",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function RoleBadge({ role, className = "" }: { role: AppRole | null; className?: string }) {
  if (!role) return null;
  const meta = ROLE_META[role];
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${meta.className} ${className}`}>
      {meta.label}
    </Badge>
  );
}
