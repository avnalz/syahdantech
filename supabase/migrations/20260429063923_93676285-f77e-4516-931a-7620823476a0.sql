-- Security definer helpers to avoid "permission denied for table users" inside RLS
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
    AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
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
    AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_row_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, anon;

-- Rebuild contacts policy
DROP POLICY IF EXISTS contacts_policy ON public.contacts;

CREATE POLICY contacts_policy ON public.contacts
FOR ALL
TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND (
    public.current_user_role() IN ('admin_agent', 'admin_developer')
    OR assigned_to = public.current_user_row_id()
  )
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND (
    public.current_user_role() IN ('admin_agent', 'admin_developer')
    OR assigned_to = public.current_user_row_id()
  )
);

-- Rebuild properties write policy (select policy is fine, only tenant scoped)
DROP POLICY IF EXISTS properties_write_policy ON public.properties;

CREATE POLICY properties_write_policy ON public.properties
FOR ALL
TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.current_user_role() IN ('admin_agent', 'admin_developer')
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.current_user_role() IN ('admin_agent', 'admin_developer')
);