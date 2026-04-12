
-- Allow the handle_new_user trigger to insert profiles
-- (trigger is SECURITY DEFINER so bypasses RLS, but we also need authenticated users to be able to)
CREATE POLICY "profiles: allow insert own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Insert missing profile for existing user
INSERT INTO public.profiles (id, tenant_id, full_name)
VALUES ('596ee5f5-8882-4784-a584-f0ba0df320a7', 1, 'lanzzikan@gmail.com')
ON CONFLICT (id) DO NOTHING;
