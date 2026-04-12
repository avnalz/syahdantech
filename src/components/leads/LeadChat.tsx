import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Contact, ChatMessage } from "@/pages/Leads";

const labelColors: Record<string, string> = {
  hot: "bg-destructive/15 text-destructive border-destructive/30",
  warm: "bg-warning/15 text-warning border-warning/30",
  cold: "bg-info/15 text-info border-info/30",
};

interface LeadChatProps {
  contact: Contact;
  messages: ChatMessage[];
  tenantId: number | null;
  onBack: () => void;
  isMobile?: boolean;
}

export function LeadChat({ contact, messages, tenantId, onBack, isMobile }: LeadChatProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [humanMode, setHumanMode] = useState(contact.mode === "human_mode");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setHumanMode(contact.mode === "human_mode");
  }, [contact]);

  const toggleHumanMode = async () => {
    const newMode = humanMode ? "ai_mode" : "human_mode";
    await supabase.from("contacts").update({ mode: newMode }).eq("id", contact.id);
    setHumanMode(!humanMode);
  };

  const sendMessage = async () => {
    if (!input.trim() || !tenantId) return;
    setSending(true);

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    try {
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_number: contact.phone_number,
            message: input.trim(),
            session: "web-admin",
          }),
        });
      }

      await supabase.from("chat_logs").insert({
        phone_number: contact.phone_number,
        direction: "outbound_human",
        message: input.trim(),
        session: "web-admin",
        tenant_id: tenantId,
      });

      setInput("");
      toast.success("Pesan berhasil dikirim");
    } catch {
      toast.error("Gagal mengirim pesan. Coba lagi.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${labelColors[contact.lead_label] || ""}`}>
              {contact.lead_label}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">Score: {contact.lead_score}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{contact.phone_number}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">Human</span>
          <Switch checked={humanMode} onCheckedChange={toggleHumanMode} />
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-10">
              Belum ada pesan
            </div>
          )}
          {messages.map((msg) => {
            const isInbound = msg.direction === "inbound";
            return (
              <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isInbound
                      ? "bg-primary/15 text-foreground rounded-bl-md"
                      : "bg-muted text-foreground rounded-br-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isInbound ? "text-primary/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    {!isInbound && (
                      <span className="ml-1.5">
                        {msg.direction === "outbound_human" ? "👤" : "🤖"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || sending} size="icon" className="shrink-0 self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
