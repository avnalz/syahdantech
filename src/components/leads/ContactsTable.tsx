import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, MessageCircle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Contact } from "@/pages/Leads";

type SortKey = "name" | "lead_score" | "lead_label" | "pipeline_stage" | "sentimen" | "last_chat_at";
type SortDir = "asc" | "desc";

interface ContactsTableProps {
  contacts: Contact[];
  loading: boolean;
  onReply: (contact: Contact) => void;
  onView: (contact: Contact) => void;
}

const PIPELINE_ORDER = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

const labelStyles: Record<string, string> = {
  hot: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  warm: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  cold: "bg-muted text-muted-foreground border-border",
};

const stageStyles: Record<string, string> = {
  new: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
  contacted: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  qualified: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  proposal: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  negotiation: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

const sentimenIcon: Record<string, string> = {
  positive: "😊",
  neutral: "😐",
  negative: "😟",
};

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPhone(raw: string) {
  if (!raw) return "-";
  // Normalize: 62xxxx -> 0xxxx
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("62")) n = "0" + n.slice(2);
  else if (!n.startsWith("0")) n = "0" + n;
  // 0812-3456-7890 / 0812-345-6789
  if (n.length <= 4) return n;
  if (n.length <= 8) return `${n.slice(0, 4)}-${n.slice(4)}`;
  return `${n.slice(0, 4)}-${n.slice(4, 8)}-${n.slice(8)}`;
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function ContactsTable({ contacts, loading, onReply, onView }: ContactsTableProps) {
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sentimenFilter, setSentimenFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("last_chat_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "last_chat_at" || key === "lead_score" ? "desc" : "asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts.filter((c) => {
      if (labelFilter !== "all" && c.lead_label !== labelFilter) return false;
      if (stageFilter !== "all" && c.pipeline_stage !== stageFilter) return false;
      if (sentimenFilter !== "all" && c.sentimen !== sentimenFilter) return false;
      if (q) {
        const name = (c.name || "").toLowerCase();
        const phone = (c.phone_number || "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return (a.name || "").localeCompare(b.name || "") * dir;
        case "lead_score":
          return (a.lead_score - b.lead_score) * dir;
        case "lead_label": {
          const order = ["cold", "warm", "hot"];
          return (order.indexOf(a.lead_label) - order.indexOf(b.lead_label)) * dir;
        }
        case "pipeline_stage":
          return (PIPELINE_ORDER.indexOf(a.pipeline_stage) - PIPELINE_ORDER.indexOf(b.pipeline_stage)) * dir;
        case "sentimen": {
          const order = ["negative", "neutral", "positive"];
          return (order.indexOf(a.sentimen) - order.indexOf(b.sentimen)) * dir;
        }
        case "last_chat_at":
        default:
          return (new Date(a.last_chat_at).getTime() - new Date(b.last_chat_at).getTime()) * dir;
      }
    });
  }, [contacts, search, labelFilter, stageFilter, sentimenFilter, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const Sortable = ({ col, children }: { col: SortKey; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(col)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <SortIcon col={col} />
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="p-3 border-b border-border space-y-3 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau No. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={labelFilter} onValueChange={setLabelFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Label" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Label</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Stage</SelectItem>
              {PIPELINE_ORDER.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sentimenFilter} onValueChange={setSentimenFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sentimen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sentimen</SelectItem>
              <SelectItem value="positive">😊 Positive</SelectItem>
              <SelectItem value="neutral">😐 Neutral</SelectItem>
              <SelectItem value="negative">😟 Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} dari {contacts.length} kontak
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="min-w-[200px]">
                <Sortable col="name">Nama</Sortable>
              </TableHead>
              <TableHead className="hidden md:table-cell">No. HP</TableHead>
              <TableHead className="min-w-[160px]">
                <Sortable col="lead_score">Lead Score</Sortable>
              </TableHead>
              <TableHead>
                <Sortable col="lead_label">Label</Sortable>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <Sortable col="pipeline_stage">Stage</Sortable>
              </TableHead>
              <TableHead className="hidden lg:table-cell text-center">
                <Sortable col="sentimen">Sentimen</Sortable>
              </TableHead>
              <TableHead className="hidden xl:table-cell">
                <Sortable col="last_chat_at">Terakhir Chat</Sortable>
              </TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  Tidak ada kontak yang sesuai filter
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const displayName = (c.name && c.name.trim()) || "Unknown";
                const isUnknown = !c.name || !c.name.trim();
                return (
                  <TableRow key={c.id} className="hover:bg-accent/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {getInitials(displayName)}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-medium text-sm truncate ${isUnknown ? "italic text-muted-foreground" : ""}`}>
                            {displayName}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {formatPhone(c.phone_number)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm font-mono">
                      {formatPhone(c.phone_number)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={c.lead_score}
                          className="h-2 w-20"
                          indicatorClassName={scoreColor(c.lead_score)}
                        />
                        <span className="text-xs font-medium w-8 text-right">{c.lead_score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize text-[10px] px-2 py-0.5 ${labelStyles[c.lead_label] || ""}`}
                      >
                        {c.lead_label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className={`capitalize text-[10px] px-2 py-0.5 ${stageStyles[c.pipeline_stage] || ""}`}
                      >
                        {c.pipeline_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center text-lg" title={c.sentimen}>
                      {sentimenIcon[c.sentimen] || "😐"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(c.last_chat_at), { addSuffix: true, locale: idLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => onReply(c)}
                          title="Balas"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1 text-xs">Balas</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => onView(c)}
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1 text-xs">Detail</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
