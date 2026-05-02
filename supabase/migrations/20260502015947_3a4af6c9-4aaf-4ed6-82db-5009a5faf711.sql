-- 1. Perbarui RLS contacts: admin_developer hanya melihat lead miliknya sendiri
DROP POLICY IF EXISTS contacts_policy ON public.contacts;

CREATE POLICY contacts_policy
ON public.contacts
FOR ALL
TO authenticated
USING (
  tenant_id = current_tenant_id()
  AND (
    current_user_role() = 'admin_agent'
    OR assigned_to = current_user_row_id()
  )
)
WITH CHECK (
  tenant_id = current_tenant_id()
  AND (
    current_user_role() = 'admin_agent'
    OR assigned_to = current_user_row_id()
  )
);

-- 2. RPC ringkasan performa agent (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.tenant_agent_performance()
RETURNS TABLE(
  user_id integer,
  name text,
  email text,
  role text,
  total_leads bigint,
  hot bigint,
  warm bigint,
  cold bigint,
  converted bigint,
  conversion_rate integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ctx AS (
    SELECT current_tenant_id() AS tid, current_user_role() AS urole
  )
  SELECT
    u.id AS user_id,
    u.name::text,
    u.email::text,
    u.role::text,
    COALESCE(c.total_leads, 0)::bigint AS total_leads,
    COALESCE(c.hot, 0)::bigint AS hot,
    COALESCE(c.warm, 0)::bigint AS warm,
    COALESCE(c.cold, 0)::bigint AS cold,
    COALESCE(c.converted, 0)::bigint AS converted,
    CASE
      WHEN COALESCE(c.total_leads, 0) = 0 THEN 0
      ELSE ROUND((c.converted::numeric / c.total_leads::numeric) * 100)::int
    END AS conversion_rate
  FROM public.users u
  CROSS JOIN ctx
  LEFT JOIN (
    SELECT
      assigned_to,
      COUNT(*) AS total_leads,
      COUNT(*) FILTER (WHERE lead_label = 'hot') AS hot,
      COUNT(*) FILTER (WHERE lead_label = 'warm') AS warm,
      COUNT(*) FILTER (WHERE lead_label = 'cold') AS cold,
      COUNT(*) FILTER (WHERE pipeline_stage IN ('won','closed_won','converted')) AS converted
    FROM public.contacts
    WHERE tenant_id = (SELECT tid FROM ctx)
    GROUP BY assigned_to
  ) c ON c.assigned_to = u.id
  WHERE u.tenant_id = (SELECT tid FROM ctx)
    AND u.is_active = true
    AND u.role <> 'admin_developer'
    AND (SELECT urole FROM ctx) IN ('admin_agent','admin_developer')
  ORDER BY total_leads DESC, u.name ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.tenant_agent_performance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_agent_performance() TO authenticated;