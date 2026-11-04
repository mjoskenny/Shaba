-- Persistent catalog, category, and order storage for the Shaba Edge Function.
CREATE TABLE IF NOT EXISTS public.kv_store_16e069d6 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE public.kv_store_16e069d6 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.kv_store_16e069d6 FROM anon, authenticated;
GRANT ALL ON TABLE public.kv_store_16e069d6 TO service_role;
