
DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe AS
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
  LOWER(u.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  OR (
    u.tenant_id = public.current_tenant_id()
    AND public.current_user_role() = ANY (ARRAY['admin_agent','admin_developer'])
  );

GRANT SELECT ON public.users_safe TO authenticated;

DROP VIEW IF EXISTS public.tenants_safe;
CREATE VIEW public.tenants_safe AS
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
