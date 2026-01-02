RBAC Setup for Unami Foundation Moments

This document explains how to apply the RBAC SQL and manage roles for the admin dashboard.

1) Apply the migration

- Open your Supabase project SQL Editor and run `supabase/rbac.sql`.
- The file creates the `admin_roles` table and example RLS policies for `moments` and `broadcasts`.

2) Seed a superadmin

- Create or locate a Supabase Auth user and take their `id` (UUID).
- Seed the `admin_roles` table using SQL (replace the UUID):

  INSERT INTO public.admin_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000000', 'superadmin');

3) Environment variables

- Ensure your server has the following env variables set:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY` (service_role for server operations)
  - `SUPABASE_ANON_KEY` (for client)
  - `INTERNAL_WEBHOOK_SECRET` (for n8n internal retries)
  - `WEBHOOK_HMAC_SECRET` (optional - for HMAC verification)

4) Role management via API

- The admin API provides endpoints for superadmins to manage roles:
  - `GET /admin/roles` — list mappings
  - `POST /admin/roles` — create/upsert mapping (body: `{ user_id, role }`)
  - `DELETE /admin/roles/:id` — remove mapping

5) Notes & cautions

- Review generated RLS policies in `supabase/rbac.sql` before applying — they are examples and may require adjustment for your schema.
- `auth.uid()` in Supabase policies depends on JWT `sub` claim; confirm your JWTs map to `auth.users.id`.
- Limit access to `SUPABASE_SERVICE_KEY`; never expose it to clients.

6) Next steps

- Add an admin UI page to manage roles (recommended).
- Audit existing policies for all tables needing role restrictions (messages, broadcasts, sponsors, system_settings).
