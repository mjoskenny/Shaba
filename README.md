# SHABA

A React + Vite storefront for SHABA leather goods.

## Local development

Requires Node.js and pnpm.

```sh
pnpm install
pnpm dev
```

Create a production build with `pnpm build`; Vite writes the deployable site to `dist/`.

## Deploy to Vercel

Import the `shaba` GitHub repository in Vercel. Vercel detects Vite automatically; use these settings if prompted:

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: `dist`

`vercel.json` provides the SPA fallback needed for direct visits and refreshes on React Router routes.

## Backend

The storefront connects to its Supabase project for catalog and store operations. The browser uses the public anon key; never expose a Supabase service-role key in client code. Configure Supabase row-level security and deploy the required Edge Function separately for the live store features.
