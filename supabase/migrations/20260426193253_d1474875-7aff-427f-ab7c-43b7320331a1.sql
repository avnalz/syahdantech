
-- 1. Enable RLS on all public tables that have policies but RLS disabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_v2 ENABLE ROW LEVEL SECURITY;

-- 2. Recreate views as SECURITY INVOKER so they respect the caller's RLS
DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe
WITH (security_invoker = true) AS
SELECT id, tenant_id, email, name, role, is_active, created_at
FROM public.users
WHERE is_active = true;

DROP VIEW IF EXISTS public.tenants_safe;
CREATE VIEW public.tenants_safe
WITH (security_invoker = true) AS
SELECT id, name, ai_model, is_active, created_at
FROM public.tenants;

-- 3. Lock down access to legacy users table (password_hash should never reach the client)
REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- 4. Grant access to the safe views for authenticated users
GRANT SELECT ON public.users_safe TO authenticated;
GRANT SELECT ON public.tenants_safe TO authenticated;

-- 5. Add a missing UPDATE policy for tenants on drip_templates is fine; ensure drip_templates has DELETE policy too
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='drip_templates' AND policyname='drip_templates: tenant delete'
  ) THEN
    CREATE POLICY "drip_templates: tenant delete" ON public.drip_templates
      FOR DELETE TO authenticated
      USING (tenant_id = (SELECT profiles.tenant_id FROM public.profiles WHERE profiles.id = auth.uid()));
  END IF;
END $$;
