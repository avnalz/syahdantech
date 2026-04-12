import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MessageSquare, UserCircle, Home, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface LeadDetailProps {
  contact: Contact;
  messages: ChatMessage[];
  tenantId: number | null;
  onBack: () => void;
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

export function LeadDetail({ contact, messages, tenantId, onBack, isMobile }: LeadDetailProps) {
  const [dripLogs, setDripLogs] = useState<DripLog[]>([]);

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
    <div className={`flex flex-col ${isMobile ? "h-screen" : "h-full"} bg-background`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{contact.name || contact.phone_number}</span>
            <Badge className={`text-[10px] px-1.5 py-0 ${labelColors[contact.lead_label] || "bg-muted text-muted-foreground"}`}>
              {contact.lead_label?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {contact.phone_number}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="detail" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-4 h-auto py-0">
          <TabsTrigger value="percakapan" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-2.5">
            <MessageSquare className="h-3.5 w-3.5" /> Percakapan
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-2.5">
            <UserCircle className="h-3.5 w-3.5" /> Detail
          </TabsTrigger>
          <TabsTrigger value="properti" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-2.5">
            <Home className="h-3.5 w-3.5" /> Properti
          </TabsTrigger>
          <TabsTrigger value="drip" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-2.5">
            <ListChecks className="h-3.5 w-3.5" /> Drip Log
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
                <InfoRow
                  label="Stage"
                  value={
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${labelOutlineColors[contact.lead_label] || ""}`}>
                      {contact.pipeline_stage}
                    </Badge>
                  }
                />
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

        {/* Properti Tab */}
        <TabsContent value="properti" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 max-w-3xl">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Properti Diminati</h3>
              {contact.properti_diminati && contact.properti_diminati.length > 0 ? (
                <div className="space-y-2">
                  {contact.properti_diminati.map((prop, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{prop}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada properti diminati.</p>
              )}
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
