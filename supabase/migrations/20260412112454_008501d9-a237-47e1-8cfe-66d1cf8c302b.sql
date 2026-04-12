
-- ===========================================
-- 1. history_v2: Add tenant_id + RLS
-- ===========================================
ALTER TABLE public.history_v2
  ADD COLUMN tenant_id integer REFERENCES public.tenants(id);

CREATE POLICY "history_v2: tenant select"
  ON public.history_v2 FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "history_v2: tenant insert"
  ON public.history_v2 FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "history_v2: tenant update"
  ON public.history_v2 FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "history_v2: tenant delete"
  ON public.history_v2 FOR DELETE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- ===========================================
-- 2. tenants: Create secure view excluding sensitive fields
-- ===========================================
CREATE OR REPLACE VIEW public.tenants_safe AS
  SELECT id, name, ai_model, is_active, created_at
  FROM public.tenants;

-- ===========================================
-- 3. drip_logs: Add tenant-scoped RLS policies
-- ===========================================
CREATE POLICY "drip_logs: tenant select"
  ON public.drip_logs FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "drip_logs: tenant insert"
  ON public.drip_logs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "drip_logs: tenant update"
  ON public.drip_logs FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "drip_logs: tenant delete"
  ON public.drip_logs FOR DELETE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- ===========================================
-- 4. history: Add tenant-scoped RLS policies
-- ===========================================
CREATE POLICY "history: tenant select"
  ON public.history FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "history: tenant insert"
  ON public.history FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- ===========================================
-- 5. users: Add RLS policies (restrict to own tenant, hide password_hash)
-- ===========================================
CREATE POLICY "users: tenant select"
  ON public.users FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "users: tenant update own"
  ON public.users FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid()));
