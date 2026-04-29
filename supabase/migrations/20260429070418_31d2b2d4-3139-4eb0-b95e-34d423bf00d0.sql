-- Allow admins (admin_agent, admin_developer) to read other users in their tenant
-- so they can list agents for filter & re-assign in Leads page.

CREATE POLICY "users: admin select tenant"
ON public.users
FOR SELECT
TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.current_user_role() = ANY (ARRAY['admin_agent', 'admin_developer'])
);