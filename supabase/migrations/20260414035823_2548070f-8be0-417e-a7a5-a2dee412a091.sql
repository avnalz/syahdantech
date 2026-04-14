-- Allow tenants to delete their own chat_logs
CREATE POLICY "chat_logs: tenant delete"
ON public.chat_logs
FOR DELETE
USING (tenant_id = (
  SELECT profiles.tenant_id
  FROM profiles
  WHERE profiles.id = auth.uid()
));