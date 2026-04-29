
-- 1) Fix handle_new_user: do NOT trust client-supplied tenant_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  resolved_tenant BIGINT;
BEGIN
  -- Try to resolve tenant from a pre-provisioned users row matching the auth email.
  -- This means an admin must have inserted a row in public.users with the user's email
  -- before they sign up. If no row exists, tenant_id is left NULL and the user
  -- will not gain access to any tenant data via RLS.
  SELECT u.tenant_id INTO resolved_tenant
  FROM public.users u
  WHERE LOWER(u.email) = LOWER(NEW.email)
  LIMIT 1;

  INSERT INTO public.profiles (id, tenant_id, full_name)
  VALUES (
    NEW.id,
    resolved_tenant, -- may be NULL; admin must provision the users row first
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

-- 2) Update current_tenant_id() to derive from users table by email (defense in depth)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT u.tenant_id::bigint
  FROM public.users u
  WHERE LOWER(u.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  LIMIT 1
$function$;

-- 3) Lock down password_hash and direct users-table reads
-- Drop existing user-readable policies that would expose password_hash
DROP POLICY IF EXISTS "users: select own row" ON public.users;
DROP POLICY IF EXISTS "users: admin select tenant" ON public.users;

-- Replace with column-restricted access via a view: we keep tenant-admin writes,
-- but remove broad SELECT from base table. Apps must read through users_safe.
REVOKE SELECT ON public.users FROM anon, authenticated;

-- 4) Recreate users_safe and tenants_safe with security_invoker = true (no SECURITY DEFINER view)
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
FROM public.users u
WHERE
  -- The user can see their own row
  LOWER(u.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  -- Or tenant admins can see other rows in their tenant
  OR (
    u.tenant_id = public.current_tenant_id()
    AND public.current_user_role() = ANY (ARRAY['admin_agent','admin_developer'])
  );

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
FROM public.tenants t
WHERE t.id = public.current_tenant_id();

GRANT SELECT ON public.tenants_safe TO authenticated;

-- 5) Lock down SECURITY DEFINER helper functions: revoke from anon/public, keep authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_row_id() FROM PUBLIC, anon;

-- 6) Document history table intent (no update/delete)
COMMENT ON TABLE public.history IS 'Append-only chat history. UPDATE and DELETE intentionally not permitted via RLS.';
