import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Contact, AgentOption } from "@/pages/Leads";

const FILTERS = [
  { label: "Semua", value: "all" },
  { label: "Perlu Tindakan", value: "needs_action" },
  { label: "Hot", value: "hot" },
  { label: "Warm", value: "warm" },
  { label: "Cold", value: "cold" },
  { label: "Human", value: "human" },
];

const labelColors: Record<string, string> = {
  hot: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  warm: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  cold: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface LeadsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  search: string;
  onSearchChange: (v: string) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  onSelect: (c: Contact) => void;
  getLastMessage: (c: Contact) => string;
  loading: boolean;
  agents?: AgentOption[];
  agentMap?: Map<number, string>;
  agentFilter?: string;
  onAgentFilterChange?: (v: string) => void;
  showAgentColumn?: boolean;
}

export function LeadsList({
  contacts,
  selectedContact,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onSelect,
  getLastMessage,
  loading,
  agents,
  agentMap,
  agentFilter = "all",
  onAgentFilterChange,
  showAgentColumn,
}: LeadsListProps) {
  return (
    <>
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau nomor HP..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Agent Filter (admin only) */}
      {showAgentColumn && agents && onAgentFilterChange && (
        <div className="px-3 py-2 border-b border-border">
          <Select value={agentFilter} onValueChange={onAgentFilterChange}>
            <SelectTrigger className="h-8 text-xs">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Filter agent" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Semua agent</SelectItem>
              <SelectItem value="unassigned" className="text-xs">Belum di-assign</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Contact List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Tidak ada kontak ditemukan
          </div>
        ) : (
          <div>
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelect(contact)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50 ${
                  selectedContact?.id === contact.id ? "bg-accent" : ""
                }`}
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {getInitials(contact.name || contact.phone_number)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-sm truncate">
                        {contact.name || contact.phone_number}
                      </span>
                      {contact.mode === "human_mode" && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0"
                        >
                          Human Mode
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(contact.last_chat_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${labelColors[contact.lead_label] || ""}`}
                    >
                      {contact.lead_label}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {contact.lead_score}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {getLastMessage(contact)}
                  </p>
                  {showAgentColumn && (
                    <div className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground truncate">
                        {contact.assigned_to != null
                          ? agentMap?.get(contact.assigned_to) ?? `Agent #${contact.assigned_to}`
                          : "Belum di-assign"}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
