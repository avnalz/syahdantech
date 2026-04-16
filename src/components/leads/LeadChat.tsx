import { useRef, useEffect, useState } from "react";
import { ArrowLeft, User, Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
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
  hideHeader?: boolean;
}

export function LeadChat({ contact, messages, tenantId, onBack, isMobile, hideHeader }: LeadChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const scrollToBottom = () => {
    const root = scrollRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => {
    // Defer to next frame so layout is committed before scrolling
    requestAnimationFrame(scrollToBottom);
  }, [messages, contact.id]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !tenantId || sending) return;
    setSending(true);

    try {
      // Insert message to chat_logs (will appear via realtime)
      const { error: insertError } = await supabase.from("chat_logs").insert({
        phone_number: contact.phone_number,
        tenant_id: tenantId,
        direction: "outbound_human",
        message: text,
      });
      if (insertError) throw insertError;

      // Forward to n8n via edge function (avoids browser CORS)
      try {
        await supabase.functions.invoke("send-whatsapp-reply", {
          body: {
            phone_number: contact.phone_number,
            tenant_id: tenantId,
            message: text,
            direction: "outbound_human",
          },
        });
      } catch (e) {
        console.warn("Webhook gagal:", e);
      }

      setInput("");
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col ${isMobile && !hideHeader ? "h-screen" : "h-full"} bg-background`}>
      {!hideHeader && (
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
        </div>
      )}

      {/* Chat Area */}
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
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

      {/* Web Chat Input - fixed footer */}
      <div className="shrink-0 border-t border-border p-3 bg-card">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik balasan..."
            rows={1}
            disabled={sending}
            className="min-h-[44px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            className="shrink-0 self-end"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
