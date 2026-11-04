-- Grant the SHABA admin role using server-managed Supabase Auth metadata.
-- raw_app_meta_data is not user-editable, unlike raw_user_meta_data.
DO $$
DECLARE
  updated_rows integer;
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'admin', 'is_admin', true)
  WHERE lower(email) = lower('mjoskenny@gmail.com');

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows = 0 THEN
    RAISE EXCEPTION 'Cannot grant admin role: auth user mjoskenny@gmail.com was not found';
  END IF;
END
$$;
