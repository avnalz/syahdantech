// Edge function to create a new agent (auth user + users + profiles + agent_sessions)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await callerClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client (bypass RLS)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Resolve caller tenant + role
    const { data: profile } = await admin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tenantId = Number(profile.tenant_id);

    const { data: callerRow } = await admin
      .from("users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("email", userData.user.email ?? "")
      .maybeSingle();
    const callerRole = callerRow?.role ?? "agent";
    if (!["admin_agent", "admin_developer"].includes(callerRole)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name, email, password, phone, wa_session } = body ?? {};

    if (!name || !email || !password || !wa_session) {
      return new Response(JSON.stringify({ error: "Field wajib: name, email, password, wa_session" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (String(password).length < 8) {
      return new Response(JSON.stringify({ error: "Password minimal 8 karakter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // a. Create auth user
    const { data: authCreated, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { tenant_id: tenantId, full_name: name },
    });
    if (createErr || !authCreated?.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "Gagal buat auth user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const newAuthId = authCreated.user.id;

    // b. Insert users row
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .insert({
        tenant_id: tenantId,
        email,
        password_hash: password,
        name,
        role: "agent",
        wa_session,
        phone: phone || null,
        is_active: true,
      })
      .select("id")
      .single();
    if (userErr || !userRow) {
      // rollback auth
      await admin.auth.admin.deleteUser(newAuthId).catch(() => {});
      return new Response(JSON.stringify({ error: userErr?.message ?? "Gagal insert users" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // c. Upsert profiles (handle_new_user trigger may have already inserted)
    await admin
      .from("profiles")
      .upsert({ id: newAuthId, tenant_id: tenantId, full_name: name }, { onConflict: "id" });

    // d. Insert agent_sessions
    const { error: sessErr } = await admin.from("agent_sessions").insert({
      tenant_id: tenantId,
      user_id: userRow.id,
      wa_session,
      is_active: true,
    });
    if (sessErr) {
      return new Response(JSON.stringify({ error: sessErr.message, partial: true }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, user_id: userRow.id, auth_id: newAuthId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
