// Edge function to forward outbound human messages to n8n webhook (avoids browser CORS)
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
    const body = await req.json();
    const { phone_number, tenant_id, message, direction } = body ?? {};

    if (!phone_number || !tenant_id || !message) {
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
        tenant_id: String(tenant_id),
        message,
        direction: direction ?? "outbound_human",
      }),
    });

    const text = await res.text();
    console.log("n8n response", res.status, text);

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status, body: text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-whatsapp-reply error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
