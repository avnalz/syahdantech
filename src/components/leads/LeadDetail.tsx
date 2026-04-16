import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MessageSquare, UserCircle, ListChecks, ArrowLeftRight, Trash2, Sparkles, Loader2 } from "lucide-react";
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
  step: number;
  is_completed: boolean;
  sent_at: string | null;
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
  onDelete?: (contactId: number) => void;
  isMobile?: boolean;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
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

export function LeadDetail({ contact, messages, tenantId, onBack, onModeChange, onStageChange, onDelete, isMobile }: LeadDetailProps) {
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

  const [deleting, setDeleting] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState(false);
  const [aiStageReason, setAiStageReason] = useState<string | null>(null);
  const handleDelete = async () => {
    if (!tenantId) return;
    setDeleting(true);
    // Delete chat logs first
    await supabase.from("chat_logs").delete().eq("phone_number", contact.phone_number).eq("tenant_id", tenantId);
    // Delete drip logs
    await supabase.from("drip_logs").delete().eq("phone_number", contact.phone_number).eq("tenant_id", tenantId);
    // Delete contact
    const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
    if (error) {
      toast.error("Gagal menghapus percakapan");
    } else {
      toast.success("Percakapan berhasil dihapus");
      onDelete?.(contact.id);
    }
    setDeleting(false);
  };

  const handleAiAnalyzeStage = async () => {
    if (!tenantId) return;
    setAnalyzingStage(true);
    setAiStageReason(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-stage", {
        body: { messages, contact },
      });
      if (error) throw error;
      if (data?.stage) {
        await supabase.from("contacts").update({ pipeline_stage: data.stage }).eq("id", contact.id);
        onStageChange?.(contact.id, data.stage);
        setAiStageReason(data.reason);
        toast.success(`Stage diubah ke "${data.stage}" oleh AI`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menganalisis stage");
    }
    setAnalyzingStage(false);
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

  // Auto-analyze stage with AI when contact is opened and has messages
  const hasAutoAnalyzed = useRef(false);
  useEffect(() => {
    if (messages.length > 0 && !hasAutoAnalyzed.current) {
      hasAutoAnalyzed.current = true;
      handleAiAnalyzeStage();
    }
  }, [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-border bg-card">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xs sm:text-sm shrink-0">
          {(contact.name || contact.phone_number).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm sm:text-base truncate block">{contact.name || contact.phone_number}</span>
          <p className="text-[11px] sm:text-xs text-muted-foreground">{contact.phone_number}</p>
        </div>
        <Badge variant="outline" className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
          {contact.lead_label ? contact.lead_label.charAt(0).toUpperCase() + contact.lead_label.slice(1) : "N/A"}
        </Badge>
        <button
          onClick={toggleHumanMode}
          className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border text-[10px] sm:text-xs font-medium hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeftRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {humanMode ? "Human" : "AI"}
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Percakapan?</AlertDialogTitle>
              <AlertDialogDescription>
                Semua pesan dan data kontak <strong>{contact.name || contact.phone_number}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isMobile ? "percakapan" : "detail"} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-muted/30 h-auto p-1 mx-0">
          <TabsTrigger value="percakapan" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <MessageSquare className="h-3.5 w-3.5" /> Percakapan
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <UserCircle className="h-3.5 w-3.5" /> Detail
          </TabsTrigger>
          <TabsTrigger value="drip" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <ListChecks className="h-3.5 w-3.5" /> Drip
          </TabsTrigger>
        </TabsList>

        {/* Percakapan Tab */}
        <TabsContent value="percakapan" className="flex-1 mt-0 overflow-hidden">
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
            <div className="p-4 space-y-6 max-w-3xl">
              {/* AI Summary */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Summary</h3>
                <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-3">
                  {contact.ai_summary || "Belum ada ringkasan AI."}
                </p>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Nama" value={contact.name} />
                <InfoRow label="Telepon" value={contact.phone_number} />
                <InfoRow label="Budget (IDR)" value={formatCurrency(contact.budget ?? null)} />
                <InfoRow label="Timeline Beli" value={contact.timeline} />
                <InfoRow
                  label="Score"
                  value={
                    <Badge className={`text-[10px] px-1.5 py-0 ${labelColors[contact.lead_label] || ""}`}>
                      {contact.lead_score}
                    </Badge>
                  }
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Stage</p>
                  <div className="flex items-center gap-1.5">
                    <Select value={contact.pipeline_stage} onValueChange={handleStageChange}>
                      <SelectTrigger className="h-7 text-xs w-[130px]">
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
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={handleAiAnalyzeStage}
                      disabled={analyzingStage}
                      title="AI tentukan stage"
                    >
                      {analyzingStage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  {aiStageReason && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">🤖 {aiStageReason}</p>
                  )}
                </div>
              </div>

              {/* Score Signals */}
              {contact.lead_score_signals && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alasan Score</h4>
                  <p className="text-sm italic text-muted-foreground">{contact.lead_score_signals}</p>
                </div>
              )}

              <Separator />

              {/* Lead Info */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informasi Lead</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Lead Masuk" value={formatRelativeTime(contact.created_at)} />
                  <InfoRow label="Balasan Terakhir" value={formatRelativeTime(contact.last_chat_at)} />
                  <InfoRow label="Kontak Terakhir" value={formatRelativeTime(contact.updated_at)} />
                  <InfoRow label="Mode" value={contact.mode === "human_mode" ? "👤 Human" : "🤖 AI"} />
                  <InfoRow label="Sentimen" value={contact.sentimen} />
                  <InfoRow
                    label="Properti Diminati"
                    value={
                      contact.properti_diminati && contact.properti_diminati.length > 0
                        ? contact.properti_diminati.join(", ")
                        : "-"
                    }
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>


        {/* Drip Log Tab */}
        <TabsContent value="drip" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 max-w-3xl">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Drip Follow-up Log</h3>
              {dripLogs.length > 0 ? (
                <div className="space-y-2">
                  {dripLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                <p className="text-sm text-muted-foreground">Belum ada drip log.</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
