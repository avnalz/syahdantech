-- 1. Add user_id columns
ALTER TABLE public.drip_templates ADD COLUMN IF NOT EXISTS user_id integer;
ALTER TABLE public.drip_logs ADD COLUMN IF NOT EXISTS user_id integer;

-- 2. Backfill: assign existing rows to admin user of their tenant
UPDATE public.drip_templates dt
SET user_id = (
  SELECT u.id FROM public.users u
  WHERE u.tenant_id = dt.tenant_id
    AND u.role IN ('admin_agent','admin_developer')
  ORDER BY u.id ASC
  LIMIT 1
)
WHERE user_id IS NULL;

UPDATE public.drip_logs dl
SET user_id = (
  SELECT u.id FROM public.users u
  WHERE u.tenant_id = dl.tenant_id
    AND u.role IN ('admin_agent','admin_developer')
  ORDER BY u.id ASC
  LIMIT 1
)
WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL on drip_templates (only if all rows have value)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.drip_templates WHERE user_id IS NULL) THEN
    ALTER TABLE public.drip_templates ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_drip_templates_user_id ON public.drip_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_drip_logs_user_id ON public.drip_logs(user_id);

-- 4. Replace RLS policies on drip_templates with per-user scoping
DROP POLICY IF EXISTS "drip_templates: tenant select" ON public.drip_templates;
DROP POLICY IF EXISTS "drip_templates: tenant insert" ON public.drip_templates;
DROP POLICY IF EXISTS "drip_templates: tenant update" ON public.drip_templates;
DROP POLICY IF EXISTS "drip_templates: tenant delete" ON public.drip_templates;

CREATE POLICY "drip_templates: own select"
  ON public.drip_templates FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id() AND user_id = current_user_row_id());

CREATE POLICY "drip_templates: own insert"
  ON public.drip_templates FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_tenant_id() AND user_id = current_user_row_id());

CREATE POLICY "drip_templates: own update"
  ON public.drip_templates FOR UPDATE
  TO authenticated
  USING (tenant_id = current_tenant_id() AND user_id = current_user_row_id())
  WITH CHECK (tenant_id = current_tenant_id() AND user_id = current_user_row_id());

CREATE POLICY "drip_templates: own delete"
  ON public.drip_templates FOR DELETE
  TO authenticated
  USING (tenant_id = current_tenant_id() AND user_id = current_user_row_id());

-- 5. Replace RLS policies on drip_logs with per-user scoping
DROP POLICY IF EXISTS "drip_logs: tenant select" ON public.drip_logs;
DROP POLICY IF EXISTS "drip_logs: tenant insert" ON public.drip_logs;
DROP POLICY IF EXISTS "drip_logs: tenant update" ON public.drip_logs;
DROP POLICY IF EXISTS "drip_logs: tenant delete" ON public.drip_logs;

CREATE POLICY "drip_logs: own select"
  ON public.drip_logs FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id() AND (user_id = current_user_row_id() OR user_id IS NULL));

CREATE POLICY "drip_logs: own insert"
  ON public.drip_logs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_tenant_id() AND user_id = current_user_row_id());

CREATE POLICY "drip_logs: own update"
  ON public.drip_logs FOR UPDATE
  TO authenticated
  USING (tenant_id = current_tenant_id() AND user_id = current_user_row_id())
  WITH CHECK (tenant_id = current_tenant_id() AND user_id = current_user_row_id());

CREATE POLICY "drip_logs: own delete"
  ON public.drip_logs FOR DELETE
  TO authenticated
  USING (tenant_id = current_tenant_id() AND user_id = current_user_row_id());