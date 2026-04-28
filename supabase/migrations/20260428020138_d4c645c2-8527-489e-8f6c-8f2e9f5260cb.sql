-- Recreate views as SECURITY INVOKER and filter via public.profiles (not auth.users)
DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe
WITH (security_invoker = true) AS
SELECT u.id, u.tenant_id, u.email, u.name, u.role, u.is_active, u.created_at
FROM public.users u
WHERE u.tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid());

DROP VIEW IF EXISTS public.tenants_safe;
CREATE VIEW public.tenants_safe
WITH (security_invoker = true) AS
SELECT t.id, t.name
FROM public.tenants t
WHERE t.id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid());

-- Grant table-level SELECT (column-level grant alone is insufficient when view
-- is security_invoker; password_hash is excluded from the view definition and
-- still protected because we GRANT only specific columns on the base table).
REVOKE ALL ON public.users FROM authenticated;
GRANT SELECT (id, tenant_id, email, name, role, is_active, created_at) ON public.users TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;

GRANT SELECT ON public.users_safe TO authenticated;
GRANT SELECT ON public.tenants_safe TO authenticated;