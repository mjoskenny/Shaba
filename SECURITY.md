# Security checklist

## Secrets and configuration
- Never commit secret or service-role keys to the repository.
- Keep Supabase keys in the deployment environment or secret manager.
- Frontend code should only use the public anon key.
- Edge Functions should read secrets from environment variables only.

## Admin protection
- Require authenticated admin sessions via Supabase Auth.
- Validate JWT claims on the server before executing admin mutations.
- Keep admin-only actions behind RLS and server enforcement.

## Input validation
- Validate all incoming JSON payloads.
- Reject malformed product, order, and analytics data.
- Sanitize strings before inserting into storage or database records.

## Deployment
- Rotate keys if they were ever exposed.
- Review logs for unauthorized access attempts.
- Keep the project on a maintained dependency set and update regularly.

## Supabase RLS and admin policy checklist
- `public.kv_store_16e069d6` must allow only `service_role` usage; no `anon` or `authenticated` access.
- `public.store_analytics_events` must allow only `service_role` usage; never expose client-write access.
- The upload bucket for application media must remain restricted to the Edge Function or explicit server-side policies.
- Admin access must require a confirmed user session and a valid admin role or allowlisted email.
- Do not expose per-user or personal data in analytics events.

## Hardening applied
- Only public Supabase anon keys are used in browser code.
- Server-only keys remain in deployment secret storage, never in source control.
- CORS is restricted to trusted origins via `ALLOWED_ORIGINS`.
- Security headers are enabled for the frontend and local preview server.
- Production admin access is gated by confirmed user email and optional `ADMIN_EMAILS` allowlisting.
- Uploaded media is validated for file type and size before storage.

## Production launch checklist
- Set all runtime variables in Vercel or your deployment secret manager, not in the repo.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAILS`
  - `ALLOWED_ORIGINS`
- Ensure the deployed site uses HTTPS and a valid custom domain with TLS enabled.
- In Supabase, verify that `public.kv_store_16e069d6` has no public access and only the service role can read/write.
- In Supabase, verify that `public.store_analytics_events` has no anonymous or authenticated client access.
- In Supabase Storage, keep the `shaba-media` bucket restricted to server-side uploads and explicit policy control; do not allow public write access.
- Confirm the admin user is created in Supabase Auth and has a confirmed email, then grant the admin role via server-side metadata only.
- Confirm `ADMIN_EMAILS` matches only the real business admin addresses.
- Validate that uploaded media has a strict file type check and size cap before the server stores it.
- Review logs regularly for failed auth attempts, unauthorized access, and suspicious upload traffic.
- Rotate any Supabase key if it was ever committed, exposed in a screenshot, log output, or a public ticket.

## Production launch approval gate
Do not deploy or announce the site live until all items below are checked and confirmed in the actual deployment environment.

- [ ] No secrets or service-role keys are stored in repo files, screenshots, logs, ticket comments, or public docs.
- [ ] Only the public Supabase anon key is used in the frontend browser bundle.
- [ ] The deployment secret store contains `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and any required admin config.
- [ ] `ADMIN_EMAILS` contains only verified business-admin addresses.
- [ ] `ALLOWED_ORIGINS` includes only the real production domain and allowed preview origins.
- [ ] HTTPS is enabled with a valid TLS certificate on the production domain.
- [ ] Supabase RLS and Storage policies are checked in the database dashboard and no anonymous client access remains.
- [ ] The media bucket is restricted to trusted server-side uploads or explicit admin-only policies.
- [ ] All admin mutations and sensitive reads are protected by server-side verification.
- [ ] A key rotation plan exists if anything sensitive was previously exposed.
- [ ] Production logs are reviewed for unauthorized access or suspicious traffic before launch.

> Go live only when every box is checked. If any item is unverified, the site should remain in staging or restricted access until the issue is fixed and re-verified.
