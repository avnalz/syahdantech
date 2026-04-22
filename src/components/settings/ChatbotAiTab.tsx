import { useEffect, useState } from "react";
import { Loader2, Bot, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AI_MODELS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (Hemat)" },
  { value: "openai/gpt-4o", label: "GPT-4o (Terbaik)" },
  { value: "openai/gpt-4-turbo", label: "GPT-4 Turbo" },
];

export default function ChatbotAiTab() {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [aiModel, setAiModel] = useState("openai/gpt-4o-mini");
  const [adminPhone, setAdminPhone] = useState("");

  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("tenants")
        .select("system_prompt, ai_model, admin_phone")
        .eq("id", tenantId)
        .maybeSingle();

      if (!error && data) {
        setSystemPrompt(data.system_prompt ?? "");
        setAiModel(data.ai_model ?? "openai/gpt-4o-mini");
        setAdminPhone(data.admin_phone ?? "");
      }
      setLoading(false);
    };
    fetchTenant();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({ system_prompt: systemPrompt, ai_model: aiModel })
      .eq("id", tenantId);

    if (error) {
      toast.error("Gagal menyimpan pengaturan");
    } else {
      toast.success("Pengaturan chatbot disimpan");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Chatbot AI
        </CardTitle>
        <CardDescription>Atur karakter, model, dan kontak chatbot AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Kamu adalah AI sales agent dari bisnis ini..."
            className="min-h-[180px]"
          />
          <p className="text-xs text-muted-foreground">
            Prompt ini menentukan karakter dan gaya bicara AI kamu
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiModel">AI Model</Label>
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger id="aiModel">
              <SelectValue placeholder="Pilih model AI" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPhone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Nomor WA Admin
          </Label>
          <Input id="adminPhone" value={adminPhone} readOnly disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Nomor ini diatur oleh vendor</p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Simpan Pengaturan
        </Button>
      </CardContent>
    </Card>
  );
}
