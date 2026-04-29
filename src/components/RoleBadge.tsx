import { cn } from "@/lib/utils";
import type { AppRole } from "@/contexts/AuthContext";

interface RoleBadgeProps {
  role: AppRole | null | undefined;
  className?: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; className: string }> = {
  admin_agent: {
    label: "Agent Mandiri",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  admin_developer: {
    label: "Developer",
    className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  },
  agent: {
    label: "Agent",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) return null;
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        cfg.className,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
