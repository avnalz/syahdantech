
-- Fix infinite recursion on public.users policies.
-- Root cause: "users: admin select tenant" calls current_tenant_id()/current_user_role()
-- which query public.users themselves — Postgres planner flags this as recursion
-- even though the functions are SECURITY DEFINER.
-- Fix: rewrite the admin policy to NOT reference public.users at all.
-- Use auth.users + public.profiles only (profiles has tenant_id and is keyed by auth.uid()).

DROP POLICY IF EXISTS "users: admin select tenant" ON public.users;

-- Allow any authenticated user in the same tenant to SELECT users in their tenant.
-- Tenant membership is resolved via profiles (which is keyed on auth.uid()) — no
-- self-reference to public.users, so no recursion.
CREATE POLICY "users: tenant members select"
ON public.users
FOR SELECT
TO authenticated
USING (
  tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
);
