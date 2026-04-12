import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LeadsList } from "@/components/leads/LeadsList";
import { LeadChat } from "@/components/leads/LeadChat";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Contact {
  id: number;
  name: string;
  phone_number: string;
  lead_label: string;
  lead_score: number;
  mode: string;
  last_chat_at: string;
  ai_summary: string;
  tenant_id: number;
}

export interface ChatMessage {
  id: number;
  phone_number: string;
  direction: string;
  message: string;
  created_at: string;
  session: string | null;
  tenant_id: number | null;
}

export default function Leads() {
  const { tenantId } = useAuth();
  const isMobile = useIsMobile();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("contacts")
      .select("id, name, phone_number, lead_label, lead_score, mode, last_chat_at, ai_summary, tenant_id")
      .eq("tenant_id", tenantId)
      .order("last_chat_at", { ascending: false });
    if (data) setContacts(data);
    setLoading(false);
  }, [tenantId]);

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async (phoneNumber: string) => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("chat_logs")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  }, [tenantId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Realtime subscription for chat_logs
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel("leads-chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_logs", filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Update messages if viewing this contact
          if (selectedContact && newMsg.phone_number === selectedContact.phone_number) {
            setMessages((prev) => [...prev, newMsg]);
          }
          // Refresh contact list
          fetchContacts();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, selectedContact, fetchContacts]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.phone_number);
    }
  }, [selectedContact, fetchMessages]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleBack = () => {
    setSelectedContact(null);
  };

  // Filter contacts
  const filtered = contacts.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_number.includes(search);
    const matchFilter =
      filter === "all" ||
      (filter === "human" ? c.mode === "human_mode" : c.lead_label === filter);
    return matchSearch && matchFilter;
  });

  // Get last message preview per contact
  const getLastMessage = (contact: Contact) => {
    // We'll show ai_summary as preview
    return contact.ai_summary || "Belum ada pesan";
  };

  // Mobile: show chat if contact selected
  if (isMobile && selectedContact) {
    return (
      <LeadChat
        contact={selectedContact}
        messages={messages}
        tenantId={tenantId}
        onBack={handleBack}
        isMobile
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Panel */}
      <div className={`${isMobile ? "w-full" : "w-[360px] min-w-[360px]"} border-r border-border flex flex-col bg-background`}>
        <LeadsList
          contacts={filtered}
          selectedContact={selectedContact}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          onSelect={handleSelectContact}
          getLastMessage={getLastMessage}
          loading={loading}
        />
      </div>

      {/* Right Panel (desktop only) */}
      {!isMobile && (
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <LeadChat
              contact={selectedContact}
              messages={messages}
              tenantId={tenantId}
              onBack={handleBack}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">Pilih kontak</p>
                <p className="text-sm">Pilih kontak dari daftar untuk mulai chat</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
