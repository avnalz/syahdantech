
-- ============================================================
-- SECURITY FIXES
-- ============================================================

-- 1. Remove plaintext password_hash column from users table.
--    Authentication is handled entirely by Supabase Auth; this column
--    has no purpose and is a critical exposure vector.
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- 2. Fix storage policies on property-photos bucket
DROP POLICY IF EXISTS "tenant_upload_photos" ON storage.objects;
DROP POLICY IF EXISTS "tenant_delete_photos" ON storage.objects;
DROP POLICY IF EXISTS "public_read_photos" ON storage.objects;

-- Recreate DELETE policy with auth + ownership (tenant-scoped via folder == auth.uid())
CREATE POLICY "tenant_delete_photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 3. Set immutable search_path on current_user_profile (missing it)
CREATE OR REPLACE FUNCTION public.current_user_profile()
RETURNS TABLE(user_row_id integer, role text, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT u.id, u.role::text, u.name::text
  FROM public.users u
  JOIN public.profiles p ON p.tenant_id = u.tenant_id
  WHERE p.id = auth.uid()
    AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1;
$function$;

-- 4. Revoke EXECUTE from anon on SECURITY DEFINER helper functions.
--    They should only be callable by authenticated users (used inside RLS).
REVOKE EXECUTE ON FUNCTION public.current_user_profile() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_user_row_id() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_row_id() TO authenticated;
