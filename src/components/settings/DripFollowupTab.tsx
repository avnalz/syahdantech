import { useState, useEffect } from "react";
import { Loader2, ChevronDown, Zap, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface DripTemplate {
  id: number;
  tenant_id: number;
  step: number;
  delay_days: number;
  is_active: boolean | null;
  stage_target: string | null;
  template_text: string;
}

const DEFAULT_TEMPLATES: Omit<DripTemplate, "id" | "tenant_id">[] = [
  { step: 1, delay_days: 1, is_active: true, stage_target: "all", template_text: "Halo {{nama}}! 👋 Terima kasih sudah menghubungi kami. Apakah ada properti di {{area}} yang menarik perhatian Anda? Kami punya pilihan terbaik mulai dari {{harga}}." },
  { step: 2, delay_days: 3, is_active: true, stage_target: "all", template_text: "Hai {{nama}}, kami ingin mengingatkan tentang properti {{properti}} di {{area}}. Unit terbatas, segera hubungi kami untuk info lebih lanjut! 🏠" },
  { step: 3, delay_days: 7, is_active: true, stage_target: "warm", template_text: "{{nama}}, properti {{properti}} memiliki estimasi ROI {{roi}} per tahun. Mau kami bantu hitungkan simulasi investasinya? 📊" },
  { step: 4, delay_days: 14, is_active: true, stage_target: "warm", template_text: "Halo {{nama}}! Ada promo spesial untuk {{properti}} di {{area}} minggu ini. Harga mulai {{harga}}. Tertarik untuk survey lokasi? 🎯" },
  { step: 5, delay_days: 21, is_active: true, stage_target: "hot", template_text: "{{nama}}, kami notice Anda sangat tertarik dengan {{properti}}. Stok tinggal sedikit! Mau kami reservasi unit terbaik untuk Anda? 🔥" },
  { step: 6, delay_days: 30, is_active: false, stage_target: "all", template_text: "Hai {{nama}}, sudah sebulan sejak terakhir ngobrol. Apakah masih mencari properti di {{area}}? Kami siap membantu kapanpun Anda siap! 😊" },
];

const STAGE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "new", label: "New" },
  { value: "warm", label: "Warm" },
  { value: "hot", label: "Hot" },
];

const PREVIEW_VARS: Record<string, string> = {
  "{{nama}}": "Budi",
  "{{properti}}": "Villa Sunrise",
  "{{area}}": "Canggu",
  "{{harga}}": "Rp 2.5 Miliar",
  "{{roi}}": "12%",
};

function replaceVars(text: string) {
  let result = text;
  for (const [key, val] of Object.entries(PREVIEW_VARS)) {
    result = result.split(key).join(val);
  }
  return result;
}

export default function DripFollowupTab() {
  const { tenantId, tenantUser } = useAuth();
  const userRowId = tenantUser?.user_row_id ?? null;
  const [templates, setTemplates] = useState<DripTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [savingStep, setSavingStep] = useState<number | null>(null);
  const [openSteps, setOpenSteps] = useState<number[]>([]);
  const [localEdits, setLocalEdits] = useState<Record<number, Partial<DripTemplate>>>({});
  const [showPreview, setShowPreview] = useState<number | null>(null);

  const fetchTemplates = async () => {
    if (!tenantId || !userRowId) { setLoading(false); return; }
    const { data } = await supabase
      .from("drip_templates")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userRowId)
      .order("step", { ascending: true });
    setTemplates((data as DripTemplate[]) || []);
    setLocalEdits({});
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, [tenantId, userRowId]);

  const handleInit = async () => {
    if (!tenantId || !userRowId) return;
    setInitializing(true);
    const rows = DEFAULT_TEMPLATES.map((t) => ({ ...t, tenant_id: tenantId, user_id: userRowId }));
    const { error } = await supabase.from("drip_templates").insert(rows);
    if (error) { toast.error("Gagal inisialisasi template"); }
    else { toast.success("6 template default berhasil dibuat"); await fetchTemplates(); }
    setInitializing(false);
  };

  const getVal = (step: number, field: keyof DripTemplate) => {
    const edit = localEdits[step];
    if (edit && field in edit) return edit[field];
    const tpl = templates.find((t) => t.step === step);
    return tpl ? tpl[field] : undefined;
  };

  const setVal = (step: number, field: keyof DripTemplate, value: any) => {
    setLocalEdits((prev) => ({ ...prev, [step]: { ...prev[step], [field]: value } }));
  };

  const handleSave = async (step: number) => {
    if (!tenantId || !userRowId) return;
    setSavingStep(step);
    const edit = localEdits[step] || {};
    const tpl = templates.find((t) => t.step === step)!;
    const { error } = await supabase
      .from("drip_templates")
      .update({
        delay_days: (edit.delay_days ?? tpl.delay_days),
        stage_target: (edit.stage_target ?? tpl.stage_target),
        template_text: (edit.template_text ?? tpl.template_text),
        is_active: (edit.is_active ?? tpl.is_active),
      })
      .eq("tenant_id", tenantId)
      .eq("user_id", userRowId)
      .eq("step", step);
    if (error) toast.error("Gagal menyimpan");
    else { toast.success(`Follow-up #${step} disimpan`); await fetchTemplates(); }
    setSavingStep(null);
  };

  const handleToggle = async (step: number, active: boolean) => {
    if (!tenantId || !userRowId) return;
    const { error } = await supabase
      .from("drip_templates")
      .update({ is_active: active })
      .eq("tenant_id", tenantId)
      .eq("user_id", userRowId)
      .eq("step", step);
    if (error) toast.error("Gagal mengubah status");
    else {
      toast.success(`Follow-up #${step} ${active ? "diaktifkan" : "dinonaktifkan"}`);
      setTemplates((prev) => prev.map((t) => t.step === step ? { ...t, is_active: active } : t));
    }
  };

  const toggleOpen = (step: number) => {
    setOpenSteps((prev) => prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Zap className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Belum ada template drip follow-up.</p>
          <Button onClick={handleInit} disabled={initializing}>
            {initializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Inisialisasi Template Default
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-2">
        Variabel: <code className="bg-muted px-1 rounded text-[11px]">{"{{nama}} {{properti}} {{area}} {{harga}} {{roi}}"}</code>
      </p>
      {templates.map((tpl) => {
        const isActive = (localEdits[tpl.step]?.is_active ?? tpl.is_active) !== false;
        const isOpen = openSteps.includes(tpl.step);
        const text = (getVal(tpl.step, "template_text") as string) || "";
        const delayDays = (getVal(tpl.step, "delay_days") as number) || tpl.delay_days;
        const stageTarget = (getVal(tpl.step, "stage_target") as string) || tpl.stage_target || "all";

        return (
          <Collapsible key={tpl.step} open={isOpen} onOpenChange={() => toggleOpen(tpl.step)}>
            <Card className={cn(
              "transition-all",
              isActive
                ? "border-primary/40 dark:border-primary/30"
                : "border-muted opacity-70"
            )}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 rounded-t-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">Follow-up #{tpl.step}</span>
                    <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
                      {isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Day {delayDays}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isActive}
                      onCheckedChange={(v) => { handleToggle(tpl.step, v); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4 border-t">
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Delay (hari)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={delayDays}
                        onChange={(e) => setVal(tpl.step, "delay_days", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stage Target</Label>
                      <Select value={stageTarget} onValueChange={(v) => setVal(tpl.step, "stage_target", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STAGE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Template Pesan WA</Label>
                    <Textarea
                      className="min-h-[120px]"
                      value={text}
                      onChange={(e) => setVal(tpl.step, "template_text", e.target.value)}
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{text.length} karakter</span>
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => setShowPreview(showPreview === tpl.step ? null : tpl.step)}
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </button>
                    </div>
                    {showPreview === tpl.step && (
                      <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap border">
                        {replaceVars(text)}
                      </div>
                    )}
                  </div>

                  <Button size="sm" onClick={() => handleSave(tpl.step)} disabled={savingStep === tpl.step}>
                    {savingStep === tpl.step && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
