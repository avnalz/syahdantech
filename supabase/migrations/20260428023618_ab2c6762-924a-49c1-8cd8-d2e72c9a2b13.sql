GRANT SELECT (id, tenant_id, email, name, role, is_active, created_at) ON public.users TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.users_safe TO authenticated;
GRANT SELECT ON public.tenants_safe TO authenticated;