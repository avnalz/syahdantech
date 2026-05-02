// Edge function: manage agents (list, create, set-active)
// Uses SERVICE_ROLE_KEY internally — never exposed to client.
// Only callers with role admin_developer in their tenant are allowed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateAgentBody {
  action: "create";
  name: string;
  email: string;
  password: string;
  phone?: string;
  wa_session: string;
}
interface SetActiveBody {
  action: "set_active";
  user_id: number;
  is_active: boolean;
}
interface ListBody {
  action: "list";
}

interface DeleteAgentBody {
  action: "delete";
  user_id: number;
}

type Body = CreateAgentBody | SetActiveBody | ListBody | DeleteAgentBody;

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Unauthorized" });
    }

    // Verify the caller's JWT and load their profile
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json(401, { error: "Invalid token" });
    }
    const callerEmail = (claimsData.claims as { email?: string }).email ?? "";

    // Service-role admin client (bypasses RLS)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Lookup caller in users table
    const { data: callerRow, error: callerErr } = await admin
      .from("users")
      .select("id, role, tenant_id")
      .ilike("email", callerEmail)
      .maybeSingle();

    if (callerErr || !callerRow) {
      return json(403, { error: "Caller not found in users table" });
    }
    if (callerRow.role !== "admin_developer") {
      return json(403, { error: "Hanya admin_developer yang diizinkan" });
    }
    const tenantId = callerRow.tenant_id as number;

    const body = (await req.json()) as Body;

    if (body.action === "list") {
      const { data: users, error } = await admin
        .from("users")
        .select("id, name, email, phone, role, is_active, wa_session, created_at")
        .eq("tenant_id", tenantId)
        .eq("role", "agent")
        .order("created_at", { ascending: false });
      if (error) return json(500, { error: error.message });

      const ids = (users ?? []).map((u) => u.id);
      const { data: sessions } = ids.length
        ? await admin
            .from("agent_sessions")
            .select("user_id, wa_session, is_active")
            .in("user_id", ids)
            .eq("is_active", true)
        : { data: [] as Array<{ user_id: number; wa_session: string; is_active: boolean }> };

      const sessionMap: Record<number, string> = {};
      (sessions ?? []).forEach((s) => {
        sessionMap[s.user_id] = s.wa_session;
      });

      const enriched = (users ?? []).map((u) => ({
        ...u,
        active_wa_session: sessionMap[u.id] ?? u.wa_session ?? null,
      }));

      return json(200, { agents: enriched });
    }

    if (body.action === "set_active") {
      if (typeof body.user_id !== "number" || typeof body.is_active !== "boolean") {
        return json(400, { error: "user_id & is_active wajib" });
      }
      // Ensure user belongs to caller's tenant
      const { data: target } = await admin
        .from("users")
        .select("id, tenant_id")
        .eq("id", body.user_id)
        .maybeSingle();
      if (!target || target.tenant_id !== tenantId) {
        return json(403, { error: "Agent tidak ditemukan di tenant Anda" });
      }

      const { error: e1 } = await admin
        .from("users")
        .update({ is_active: body.is_active })
        .eq("id", body.user_id);
      if (e1) return json(500, { error: e1.message });

      const { error: e2 } = await admin
        .from("agent_sessions")
        .update({ is_active: body.is_active })
        .eq("user_id", body.user_id);
      if (e2) return json(500, { error: e2.message });

      return json(200, { success: true });
    }

    if (body.action === "delete") {
      if (typeof body.user_id !== "number") {
        return json(400, { error: "user_id wajib" });
      }
      const { data: target } = await admin
        .from("users")
        .select("id, tenant_id, role, email")
        .eq("id", body.user_id)
        .maybeSingle();
      if (!target || target.tenant_id !== tenantId) {
        return json(403, { error: "Agent tidak ditemukan di tenant Anda" });
      }
      if (target.role !== "agent") {
        return json(400, { error: "Hanya akun agent yang bisa dihapus" });
      }

      // Lookup auth user by email
      let authUserId: string | null = null;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users?.find(
        (u) => (u.email ?? "").toLowerCase() === (target.email ?? "").toLowerCase(),
      );
      authUserId = found?.id ?? null;

      await admin.from("agent_sessions").delete().eq("user_id", body.user_id);

      const { error: delUserErr } = await admin
        .from("users")
        .delete()
        .eq("id", body.user_id);
      if (delUserErr) return json(500, { error: delUserErr.message });

      if (authUserId) {
        await admin.auth.admin.deleteUser(authUserId).catch(() => {});
      }

      return json(200, { success: true });
    }

    if (body.action === "create") {
      const { name, email, password, phone, wa_session } = body;
      if (!name || !email || !password || !wa_session) {
        return json(400, { error: "Field wajib tidak lengkap" });
      }
      if (password.length < 8) {
        return json(400, { error: "Password minimal 8 karakter" });
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return json(400, { error: "Format email tidak valid" });
      }

      // 1. Pre-insert users row FIRST so handle_new_user trigger can resolve tenant_id by email
      const { data: userRow, error: userErr } = await admin
        .from("users")
        .insert({
          tenant_id: tenantId,
          email,
          name,
          role: "agent",
          wa_session,
          phone: phone ?? null,
          is_active: true,
        })
        .select("id")
        .single();
      if (userErr || !userRow) {
        return json(500, { error: userErr?.message ?? "Gagal insert users" });
      }

      // 2. Create auth user (trigger will now find tenant_id via email lookup)
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, tenant_id: tenantId },
      });
      if (authErr || !authData?.user) {
        // Rollback users insert
        await admin.from("users").delete().eq("id", userRow.id);
        return json(400, { error: authErr?.message ?? "Gagal membuat auth user" });
      }
      const authUserId = authData.user.id;

      // 3. Link auth user to the pre-inserted users row
      const { error: linkErr } = await admin
        .from("users")
        .update({ auth_user_id: authUserId })
        .eq("id", userRow.id);
      if (linkErr) {
        return json(500, { error: linkErr.message });
      }

      // 4. Insert agent_sessions
      const { error: sessErr } = await admin.from("agent_sessions").insert({
        tenant_id: tenantId,
        user_id: userRow.id,
        wa_session,
        is_active: true,
      });
      if (sessErr) {
        return json(500, { error: sessErr.message });
      }

      return json(200, { success: true, user_id: userRow.id, auth_user_id: authUserId });
    }

    return json(400, { error: "Action tidak dikenal" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(500, { error: msg });
  }
});
