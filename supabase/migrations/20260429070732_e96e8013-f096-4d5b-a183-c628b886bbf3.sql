-- RLS only filters rows; the role still needs base privileges.
GRANT SELECT ON public.users TO authenticated;