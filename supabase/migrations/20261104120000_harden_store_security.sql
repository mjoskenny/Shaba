-- Harden the SHABA database: no anonymous or authenticated client access to internal store data.
-- All application writes are performed by the Edge Function via the service role.

ALTER TABLE public.kv_store_16e069d6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_analytics_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.kv_store_16e069d6 FROM anon, authenticated;
REVOKE ALL ON TABLE public.store_analytics_events FROM anon, authenticated;

GRANT ALL ON TABLE public.kv_store_16e069d6 TO service_role;
GRANT ALL ON TABLE public.store_analytics_events TO service_role;

DROP POLICY IF EXISTS kv_store_service_role_only ON public.kv_store_16e069d6;
DROP POLICY IF EXISTS analytics_service_role_only ON public.store_analytics_events;

CREATE POLICY kv_store_service_role_only
  ON public.kv_store_16e069d6
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY analytics_service_role_only
  ON public.store_analytics_events
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Supabase storage buckets for customer media must also remain private or limited to the server-side upload flow.
-- Do not grant public read/write access to storage objects unless intentionally required for public storefront assets.
-- Keep upload policies server-side and verify file type, size, and bucket ownership before storing user-submitted files.
