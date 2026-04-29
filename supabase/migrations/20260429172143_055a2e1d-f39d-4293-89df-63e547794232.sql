
-- Grant column-level SELECT on users (excluding password_hash) to authenticated.
-- This lets the views (with security_invoker) read non-sensitive columns,
-- while password_hash remains unreadable via the API.
GRANT SELECT (
  id, tenant_id, email, name, role, is_active, wa_session, phone, created_at
) ON public.users TO authenticated;

-- Recreate views with security_invoker = true and without referencing auth.users
DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe
WITH (security_invoker = true) AS
SELECT
  u.id,
  u.tenant_id,
  u.email,
  u.name,
  u.role,
  u.is_active,
  u.wa_session,
  u.phone,
  u.created_at
FROM public.users u;
-- No WHERE clause: filtering happens via RLS on the base table (security_invoker)

GRANT SELECT ON public.users_safe TO authenticated;

DROP VIEW IF EXISTS public.tenants_safe;
CREATE VIEW public.tenants_safe
WITH (security_invoker = true) AS
SELECT
  t.id,
  t.name,
  t.tenant_type,
  t.wa_session,
  t.admin_phone,
  t.admin_name,
  t.ai_model,
  t.system_prompt,
  t.scoring_prompt,
  t.is_active,
  t.created_at
FROM public.tenants t;

GRANT SELECT ON public.tenants_safe TO authenticated;

-- Re-add the RLS SELECT policies on users so the security_invoker view works.
-- These policies do NOT expose password_hash because the column-level GRANT above excludes it.
DROP POLICY IF EXISTS "users: select own row" ON public.users;
CREATE POLICY "users: select own row"
ON public.users
FOR SELECT
TO authenticated
USING (
  LOWER(email) = LOWER((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
);

DROP POLICY IF EXISTS "users: admin select tenant" ON public.users;
CREATE POLICY "users: admin select tenant"
ON public.users
FOR SELECT
TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.current_user_role() = ANY (ARRAY['admin_agent','admin_developer'])
);
