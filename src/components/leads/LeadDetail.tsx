import { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MessageSquare, UserCircle, ListChecks, ArrowLeftRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { LeadChat } from "./LeadChat";
import type { Contact, ChatMessage } from "@/pages/Leads";

const labelColors: Record<string, string> = {
  hot: "bg-destructive text-destructive-foreground",
  warm: "bg-amber-500 text-white",
  cold: "bg-blue-500 text-white",
};

const labelOutlineColors: Record<string, string> = {
  hot: "bg-destructive/15 text-destructive border-destructive/30",
  warm: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  cold: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

interface DripLog {
  id: number;
  phone_number: string;
  drip_step: number;
  is_completed: boolean;
  last_drip_at: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: number;
}

const PIPELINE_STAGES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] as const;

interface LeadDetailProps {
  contact: Contact;
  messages: ChatMessage[];
  tenantId: number | null;
  onBack: () => void;
  onModeChange?: (contactId: number, newMode: string) => void;
  onStageChange?: (contactId: number, newStage: string) => void;
  isMobile?: boolean;
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium">{value || "-"}</div>
    </div>
  );
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function formatCurrency(value: number | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("id-ID").format(value);
}

export function LeadDetail({ contact, messages, tenantId, onBack, onModeChange, onStageChange, isMobile }: LeadDetailProps) {
  const [dripLogs, setDripLogs] = useState<DripLog[]>([]);
  const [humanMode, setHumanMode] = useState(contact.mode === "human_mode");

  useEffect(() => {
    setHumanMode(contact.mode === "human_mode");
  }, [contact]);

  const toggleHumanMode = async () => {
    const newMode = humanMode ? "ai_mode" : "human_mode";
    await supabase.from("contacts").update({ mode: newMode }).eq("id", contact.id);
    setHumanMode(!humanMode);
    onModeChange?.(contact.id, newMode);
  };

  const handleStageChange = async (newStage: string) => {
    await supabase.from("contacts").update({ pipeline_stage: newStage }).eq("id", contact.id);
    onStageChange?.(contact.id, newStage);
  };

  const fetchDripLogs = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("drip_logs")
      .select("*")
      .eq("phone_number", contact.phone_number)
      .eq("tenant_id", tenantId)
      .order("drip_step", { ascending: true });
    if (data) setDripLogs(data);
  }, [tenantId, contact.phone_number]);

  useEffect(() => {
    fetchDripLogs();
  }, [fetchDripLogs]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-border bg-card">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm shrink-0">
          {(contact.name || contact.phone_number).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base truncate">{contact.name || contact.phone_number}</span>
            <Badge className={`text-[10px] px-1.5 py-0 uppercase ${labelColors[contact.lead_label] || "bg-muted text-muted-foreground"}`}>
              {contact.lead_label || "N/A"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{contact.phone_number}</p>
        </div>
        <button
          onClick={toggleHumanMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {humanMode ? "Human Mode" : "AI Mode"}
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isMobile ? "percakapan" : "detail"} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border bg-transparent h-auto p-0 mx-0 shrink-0">
          <TabsTrigger value="percakapan" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5">
            <MessageSquare className="h-3.5 w-3.5" /> Percakapan
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5">
            <UserCircle className="h-3.5 w-3.5" /> Detail
          </TabsTrigger>
          <TabsTrigger value="properti" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5">
            <Building2 className="h-3.5 w-3.5" /> Properti
          </TabsTrigger>
          <TabsTrigger value="drip" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5">
            <ListChecks className="h-3.5 w-3.5" /> Drip Log
          </TabsTrigger>
        </TabsList>

        {/* Percakapan Tab */}
        <TabsContent value="percakapan" className="flex-1 mt-0 overflow-hidden flex flex-col">
          <LeadChat
            contact={contact}
            messages={messages}
            tenantId={tenantId}
            onBack={onBack}
            isMobile={isMobile}
            hideHeader
          />
        </TabsContent>

        {/* Detail Tab */}
        <TabsContent value="detail" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-0">
              {/* AI Summary */}
              <div className="py-3 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1.5">AI Summary</p>
                <p className="text-sm leading-relaxed">
                  {contact.ai_summary || "Belum ada ringkasan AI."}
                </p>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 border-b border-border">
                <div className="py-2.5 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Nama</p>
                  <p className="text-sm font-medium">{contact.name || "-"}</p>
                </div>
                <div className="py-2.5 border-b border-border pl-6">
                  <p className="text-xs text-muted-foreground mb-1">Telepon</p>
                  <p className="text-sm font-medium">{contact.phone_number}</p>
                </div>
                <div className="py-2.5 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Budget (IDR)</p>
                  <p className="text-sm font-medium">{formatCurrency(contact.budget ?? null)}</p>
                </div>
                <div className="py-2.5 border-b border-border pl-6">
                  <p className="text-xs text-muted-foreground mb-1">Timeline Beli</p>
                  <p className="text-sm font-medium">{contact.timeline || "-"}</p>
                </div>
                <div className="py-2.5">
                  <p className="text-xs text-muted-foreground mb-1">Score</p>
                  <Badge className={`text-[10px] px-2 py-0.5 uppercase ${labelColors[contact.lead_label] || ""}`}>
                    {contact.lead_label?.toUpperCase() || "N/A"}
                  </Badge>
                </div>
                <div className="py-2.5 pl-6">
                  <p className="text-xs text-muted-foreground mb-1">Stage</p>
                  <Select value={contact.pipeline_stage} onValueChange={handleStageChange}>
                    <SelectTrigger className="h-7 text-xs w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage} className="text-xs capitalize">
                          {stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Alasan Score */}
              {contact.lead_score_signals && (
                <div className="py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Alasan Score</p>
                  <p className="text-sm italic text-muted-foreground">{contact.lead_score_signals}</p>
                </div>
              )}

              {/* Informasi Lead */}
              <div className="py-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Informasi Lead</h3>
              </div>
              <div className="grid grid-cols-2 border-t border-border">
                <div className="py-2.5 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Lead Masuk</p>
                  <p className="text-sm font-medium">{formatRelativeTime(contact.created_at)}</p>
                </div>
                <div className="py-2.5 border-b border-border pl-6">
                  <p className="text-xs text-muted-foreground mb-1">Balasan Terakhir</p>
                  <p className="text-sm font-medium">{formatRelativeTime(contact.last_chat_at)}</p>
                </div>
                <div className="py-2.5 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Kontak Terakhir</p>
                  <p className="text-sm font-medium">{formatRelativeTime(contact.updated_at)}</p>
                </div>
                <div className="py-2.5 border-b border-border pl-6">
                  <p className="text-xs text-muted-foreground mb-1">Mode</p>
                  <p className="text-sm font-medium">{contact.mode === "human_mode" ? "👤 Human" : "🤖 AI"}</p>
                </div>
                <div className="py-2.5 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Sentimen</p>
                  <p className="text-sm font-medium">{contact.sentimen || "-"}</p>
                </div>
                <div className="py-2.5 border-b border-border pl-6">
                  <p className="text-xs text-muted-foreground mb-1">Properti Diminati</p>
                  <p className="text-sm font-medium">
                    {contact.properti_diminati && contact.properti_diminati.length > 0
                      ? contact.properti_diminati.join(", ")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Properti Tab */}
        <TabsContent value="properti" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground">Belum ada data properti diminati.</p>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Drip Log Tab */}
        <TabsContent value="drip" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-0">
              {dripLogs.length > 0 ? (
                <div>
                  {dripLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${log.is_completed ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <div>
                          <p className="text-sm font-medium">Step {log.drip_step}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.last_drip_at ? formatRelativeTime(log.last_drip_at) : "Belum dikirim"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${log.is_completed ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "border-amber-500/30 text-amber-600 dark:text-amber-400"}`}>
                        {log.is_completed ? "Selesai" : "Aktif"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">Belum ada drip log.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
