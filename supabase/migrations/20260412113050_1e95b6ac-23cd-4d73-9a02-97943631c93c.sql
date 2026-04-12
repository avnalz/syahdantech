
-- Fix: Recreate tenants_safe as SECURITY INVOKER
DROP VIEW IF EXISTS public.tenants_safe;
CREATE VIEW public.tenants_safe
  WITH (security_invoker = true)
  AS SELECT id, name, ai_model, is_active, created_at
  FROM public.tenants;

-- Create safe view for users (exclude password_hash)
CREATE VIEW public.users_safe
  WITH (security_invoker = true)
  AS SELECT id, name, email, role, tenant_id, is_active, created_at
  FROM public.users;
