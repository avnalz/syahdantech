-- Replace recursive helper logic and self-referencing policies with security-definer helpers.

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tenant_id::bigint
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_profile()
RETURNS TABLE(user_row_id integer, role text, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.role::text, u.name::text
  FROM public.users u
  JOIN public.profiles p ON p.tenant_id = u.tenant_id
  WHERE p.id = auth.uid()
    AND lower(u.email::text) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role::text
  FROM public.users u
  JOIN public.profiles p ON p.tenant_id = u.tenant_id
  WHERE p.id = auth.uid()
    AND lower(u.email::text) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_row_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  JOIN public.profiles p ON p.tenant_id = u.tenant_id
  WHERE p.id = auth.uid()
    AND lower(u.email::text) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(bool_or(u.is_superadmin), false)
  FROM public.users u
  WHERE lower(u.email::text) = lower(auth.jwt() ->> 'email')
$$;

DROP POLICY IF EXISTS "users: superadmin full access" ON public.users;
CREATE POLICY "users: superadmin full access"
ON public.users
FOR ALL
TO authenticated
USING (public.current_user_is_superadmin())
WITH CHECK (public.current_user_is_superadmin());

DROP POLICY IF EXISTS "contacts: superadmin full access" ON public.contacts;
CREATE POLICY "contacts: superadmin full access"
ON public.contacts
FOR ALL
TO authenticated
USING (public.current_user_is_superadmin())
WITH CHECK (public.current_user_is_superadmin());

DROP POLICY IF EXISTS "properties: superadmin full access" ON public.properties;
CREATE POLICY "properties: superadmin full access"
ON public.properties
FOR ALL
TO authenticated
USING (public.current_user_is_superadmin())
WITH CHECK (public.current_user_is_superadmin());

DROP POLICY IF EXISTS "tenants: superadmin full access" ON public.tenants;
CREATE POLICY "tenants: superadmin full access"
ON public.tenants
FOR ALL
TO authenticated
USING (public.current_user_is_superadmin())
WITH CHECK (public.current_user_is_superadmin());

DROP POLICY IF EXISTS "chat_logs: superadmin full access" ON public.chat_logs;
CREATE POLICY "chat_logs: superadmin full access"
ON public.chat_logs
FOR ALL
TO authenticated
USING (public.current_user_is_superadmin())
WITH CHECK (public.current_user_is_superadmin());