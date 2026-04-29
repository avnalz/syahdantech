CREATE OR REPLACE FUNCTION public.current_user_profile()
RETURNS TABLE(user_row_id integer, role text, name text, email text, tenant_id integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.role::text, u.name::text, u.email::text, u.tenant_id
  FROM public.users u
  WHERE LOWER(u.email) = LOWER((SELECT au.email FROM auth.users au WHERE au.id = auth.uid()))
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_user_profile() TO authenticated;