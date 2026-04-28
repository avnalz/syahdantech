-- Recreate users_safe and tenants_safe as SECURITY DEFINER (default) views that
-- internally filter by the calling user's auth.uid(). This avoids the need to
-- grant table-level SELECT on the underlying users table while still preventing
-- access to password_hash (column not selected) and other tenants' rows.

DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe AS
SELECT u.id, u.tenant_id, u.email, u.name, u.role, u.is_active, u.created_at
FROM public.users u
WHERE u.email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid());

DROP VIEW IF EXISTS public.tenants_safe;
CREATE VIEW public.tenants_safe AS
SELECT t.id, t.name
FROM public.tenants t
WHERE t.id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid());

GRANT SELECT ON public.users_safe TO authenticated;
GRANT SELECT ON public.tenants_safe TO authenticated;