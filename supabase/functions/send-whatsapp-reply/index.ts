// Edge function to forward outbound human messages to n8n webhook (avoids browser CORS)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL =
  "https://n8n-qzrkfmjw86rg.siomay.sumopod.my.id/webhook/reply-chat";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Derive tenant_id server-side from the authenticated user — never trust the client.
    const { data: userRow, error: userLookupErr } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (userLookupErr || !userRow?.tenant_id) {
      return new Response(JSON.stringify({ error: "Tenant not found for user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authorizedTenantId = userRow.tenant_id;

    const body = await req.json();
    const { phone_number, message, direction } = body ?? {};

    if (!phone_number || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number,
        tenant_id: String(authorizedTenantId),
        message,
        direction: direction ?? "outbound_human",
      }),
    });

    const text = await res.text();
    console.log("n8n response", res.status, text);

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-whatsapp-reply error", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
