-- Allow users to read their own row (needed before current_tenant_id() works)
CREATE POLICY "users: select own row"
ON public.users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());