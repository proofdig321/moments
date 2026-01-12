# RBAC Setup for Unami Foundation Moments

This document explains how to apply the RBAC SQL and manage roles for the admin dashboard.

## 1. Apply the RBAC Schema

**Step 1**: Apply the complete RBAC schema
```sql
-- In Supabase SQL Editor, run in this order:
-- 1. supabase/rbac-complete.sql (creates admin_roles table and functions)
-- 2. supabase/rbac.sql (creates RLS policies)
```

**Step 2**: Verify tables were created
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_roles', 'audit_log', 'webhook_tokens', 'system_settings');
```

## 2. Seed a Superadmin

**Method A**: Using the seed script
```bash
export SUPERADMIN_USER_ID="your-supabase-user-uuid-here"
export DATABASE_URL="your-supabase-connection-string"
./scripts/seed_superadmin.sh
```

**Method B**: Manual SQL (in Supabase SQL Editor)
```sql
-- Replace with actual Supabase Auth user UUID
INSERT INTO public.admin_roles (user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000000', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

## 3. Role Hierarchy

- **superadmin**: Full system access, can manage all users and roles
- **content_admin**: Can manage moments, sponsors, broadcasts
- **moderator**: Can review content, view messages, update moment status
- **viewer**: Read-only access to basic data

## 4. Environment Variables Required

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Webhook Security
INTERNAL_WEBHOOK_SECRET=your-internal-secret
WEBHOOK_HMAC_SECRET=your-hmac-secret
```

## 5. API Endpoints for Role Management

### List Roles
```http
GET /admin/roles
Authorization: Bearer <supabase-jwt>
```

### Create/Update Role
```http
POST /admin/roles
Authorization: Bearer <supabase-jwt>
Content-Type: application/json

{
  "user_id": "uuid",
  "role": "content_admin"
}
```

### Delete Role
```http
DELETE /admin/roles/:id
Authorization: Bearer <supabase-jwt>
```

## 6. Testing RBAC

**Test Authentication**
```bash
# Should return 401 without auth
curl http://localhost:8080/admin/moments

# Should work with valid JWT
curl -H "Authorization: Bearer <jwt>" http://localhost:8080/admin/moments
```

**Test Role Permissions**
```bash
# Run the auth test suite
npm test tests/auth-campaign.test.js
```

## 7. Troubleshooting

### Common Issues

**Issue**: `check_admin_role` function not found
**Solution**: Run `supabase/rbac-complete.sql` first

**Issue**: RLS policies blocking access
**Solution**: Ensure JWT contains correct `sub` claim matching user_id

**Issue**: No role found for user
**Solution**: Insert role mapping in admin_roles table

### Debug Queries

```sql
-- Check if user has role
SELECT * FROM admin_roles WHERE user_id = 'your-uuid';

-- Test role function
SELECT check_admin_role('superadmin');

-- View current JWT claims
SELECT current_setting('request.jwt.claims', true);
```

## 8. Security Notes

- **Service Key**: Never expose `SUPABASE_SERVICE_KEY` to clients
- **JWT Validation**: All admin endpoints require valid Supabase JWT
- **Role Hierarchy**: Higher roles inherit lower role permissions
- **Audit Trail**: All role changes are logged in `audit_log` table
- **RLS Enabled**: All tables have Row Level Security enabled

## 9. Next Steps

- [ ] Add admin UI for role management
- [ ] Implement role-based navigation in frontend
- [ ] Add email notifications for role changes
- [ ] Set up automated role cleanup for inactive users
- [ ] Add role-based API rate limiting
