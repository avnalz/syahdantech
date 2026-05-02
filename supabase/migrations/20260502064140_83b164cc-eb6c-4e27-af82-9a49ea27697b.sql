-- 1. Add auth_user_id to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- 2. Backfill from profiles (profiles.id = auth.users.id, match users by email)
UPDATE public.users u
SET auth_user_id = p.id
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE lower(u.email) = lower(au.email)
  AND u.auth_user_id IS NULL;

-- Also try direct match by email against auth.users for any remaining
UPDATE public.users u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.auth_user_id IS NULL
  AND lower(u.email) = lower(au.email);

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON public.users(lower(email::text));

-- 3. Replace helper functions to use auth_user_id (no more profiles)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.tenant_id::bigint FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.role::text FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_row_id()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_profile()
RETURNS TABLE(user_row_id integer, role text, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.role::text, u.name::text FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(bool_or(u.is_superadmin), false) FROM public.users u WHERE u.auth_user_id = auth.uid()
$$;

-- 4. Replace handle_new_user trigger function: link auth user to existing users row by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.users
  SET auth_user_id = NEW.id
  WHERE auth_user_id IS NULL
    AND lower(email::text) = lower(NEW.email);
  RETURN NEW;
END;
$$;

-- 5. Drop policies that reference profiles, recreate using users
-- TENANTS
DROP POLICY IF EXISTS "tenants: tenant select own" ON public.tenants;
DROP POLICY IF EXISTS "tenants: tenant update own" ON public.tenants;
CREATE POLICY "tenants: tenant select own" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.current_tenant_id());
CREATE POLICY "tenants: tenant update own" ON public.tenants
  FOR UPDATE TO authenticated
  USING (id = public.current_tenant_id())
  WITH CHECK (id = public.current_tenant_id());

-- PROPERTIES
DROP POLICY IF EXISTS properties_select_policy ON public.properties;
CREATE POLICY properties_select_policy ON public.properties
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- HISTORY
DROP POLICY IF EXISTS "history: tenant select" ON public.history;
DROP POLICY IF EXISTS "history: tenant insert" ON public.history;
CREATE POLICY "history: tenant select" ON public.history
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "history: tenant insert" ON public.history
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());

-- HISTORY_V2
DROP POLICY IF EXISTS "history_v2: tenant select" ON public.history_v2;
DROP POLICY IF EXISTS "history_v2: tenant insert" ON public.history_v2;
DROP POLICY IF EXISTS "history_v2: tenant update" ON public.history_v2;
DROP POLICY IF EXISTS "history_v2: tenant delete" ON public.history_v2;
CREATE POLICY "history_v2: tenant select" ON public.history_v2 FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "history_v2: tenant insert" ON public.history_v2 FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "history_v2: tenant update" ON public.history_v2 FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "history_v2: tenant delete" ON public.history_v2 FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id());

-- USERS: drop policies depending on profiles, recreate
DROP POLICY IF EXISTS "users: tenant members select" ON public.users;
DROP POLICY IF EXISTS "users: tenant update own" ON public.users;
DROP POLICY IF EXISTS "users: select own row" ON public.users;
CREATE POLICY "users: tenant members select" ON public.users
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY "users: update own row" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- 6. Drop profiles table (no longer used)
DROP TABLE IF EXISTS public.profiles CASCADE;