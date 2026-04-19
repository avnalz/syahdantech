import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- AUTH CHECK ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, contact } = await req.json();

    if (!messages || !contact) {
      return new Response(JSON.stringify({ error: "Missing messages or contact" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const chatHistory = messages
      .map((m: { direction: string; message: string }) =>
        `${m.direction === "inbound" ? "Customer" : "Sales"}: ${m.message}`
      )
      .join("\n");

    const systemPrompt = `Kamu adalah AI analyst untuk CRM properti. Tugasmu menentukan pipeline_stage yang tepat berdasarkan percakapan WhatsApp antara sales dan customer.

Pipeline stages yang tersedia (pilih SATU):
- "new" = Kontak baru, belum ada interaksi bermakna
- "contacted" = Sudah ada komunikasi awal, tanya jawab dasar
- "qualified" = Customer sudah menunjukkan minat nyata (tanya harga, lokasi, spesifikasi)
- "proposal" = Sudah dikirimi penawaran/brosur/simulasi KPR
- "negotiation" = Sedang negosiasi harga, DP, cicilan, atau jadwal survey
- "won" = Deal berhasil, customer booking/bayar DP
- "lost" = Customer menolak/tidak tertarik/ghosting lama

Info kontak saat ini:
- Nama: ${contact.name}
- Label: ${contact.lead_label}
- Score: ${contact.lead_score}
- Stage saat ini: ${contact.pipeline_stage}
- Sentimen: ${contact.sentimen}
- Budget: ${contact.budget || "tidak diketahui"}
- Timeline: ${contact.timeline || "tidak diketahui"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Berikut percakapan:\n\n${chatHistory}\n\nTentukan pipeline stage yang paling tepat.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_pipeline_stage",
              description: "Set the pipeline stage for this contact",
              parameters: {
                type: "object",
                properties: {
                  stage: {
                    type: "string",
                    enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
                  },
                  reason: {
                    type: "string",
                    description: "Alasan singkat dalam Bahasa Indonesia kenapa stage ini dipilih",
                  },
                },
                required: ["stage", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_pipeline_stage" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, coba lagi nanti." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credit habis, silakan top up." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI tidak memberikan rekomendasi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-stage error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
