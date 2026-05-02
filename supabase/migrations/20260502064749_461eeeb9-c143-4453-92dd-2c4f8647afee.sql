GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure the own-row policy exists safely even if previous migration only partially applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users: select own row'
  ) THEN
    CREATE POLICY "users: select own row"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());
  END IF;
END $$;