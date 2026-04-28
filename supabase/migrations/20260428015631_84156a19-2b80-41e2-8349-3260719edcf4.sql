-- Restore SELECT access to authenticated users on the users table for non-sensitive columns only.
-- RLS policies still restrict which rows each user can see; password_hash is excluded.
GRANT SELECT (id, tenant_id, email, name, role, is_active, created_at) ON public.users TO authenticated;

-- Ensure the safe view is also accessible
GRANT SELECT ON public.users_safe TO authenticated;
GRANT SELECT ON public.tenants_safe TO authenticated;