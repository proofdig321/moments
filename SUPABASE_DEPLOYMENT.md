# 📋 SUPABASE DEPLOYMENT CHECKLIST

## 🗄️ DATABASE SCHEMA FILES TO APPLY

### Core Schema (Apply in order):
1. `fix-advisories-schema.sql` - **FIX FIRST** - Add missing moment_id column
2. `supabase/schema.sql` - Base tables
3. `supabase/enhanced-schema.sql` - Enhanced columns
4. `fix-mcp-trigger.sql` - **FIX SECOND** - Correct trigger function
5. `supabase/rbac-complete.sql` - Admin users and roles
6. `supabase/migrations/20250111_add_moderation_support.sql` - Moderation support
7. `setup-admin-user.sql` - **Your admin account (info@unamifoundation.org)**
8. `setup-storage.sql` - Media storage bucket

### Additional Schema Files:
- `supabase/moments-schema.sql` - Moments table structure
- `supabase/campaigns.sql` - Campaign management
- `supabase/sponsors-update.sql` - Sponsor management
- `supabase/media-enhanced-clean.sql` - Media storage support

## 🔧 EDGE FUNCTIONS TO DEPLOY

### Required Functions:
```bash
supabase functions deploy webhook
supabase functions deploy admin-api  
supabase functions deploy handleMomentCreated
supabase functions deploy public-api
supabase functions deploy broadcast-webhook
```

### Function Files:
- `supabase/functions/webhook/index.ts`
- `supabase/functions/admin-api/index.ts`
- `supabase/functions/handleMomentCreated/index.ts`
- `supabase/functions/public-api/index.ts`
- `supabase/functions/broadcast-webhook/index.ts`

## 🗂️ STORAGE BUCKETS TO CREATE

### Media Storage:
```sql
-- Create media bucket for images/videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true);

-- Set up RLS policies for media bucket
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admin upload access" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'media');
```

## 👤 ADMIN USER SETUP

### Create Admin User (info@unamifoundation.org):
```sql
-- Insert admin user
INSERT INTO admin_users (
  id,
  email, 
  name,
  password_hash,
  active,
  created_at
) VALUES (
  gen_random_uuid(),
  'info@unamifoundation.org',
  'Unami Foundation Admin',
  '$2b$10$placeholder_hash_replace_with_real_bcrypt',
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  active = true,
  updated_at = NOW();

-- Grant superadmin role
INSERT INTO admin_roles (
  user_id,
  role,
  granted_by,
  granted_at
) SELECT 
  id,
  'superadmin',
  'system',
  NOW()
FROM admin_users 
WHERE email = 'info@unamifoundation.org'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'superadmin',
  granted_at = NOW();
```

## 🔐 ENVIRONMENT VARIABLES FOR EDGE FUNCTIONS

### Set in Supabase Dashboard > Settings > Edge Functions:
```bash
WHATSAPP_TOKEN=<your_whatsapp_token>
WHATSAPP_PHONE_ID=940140815849209
WEBHOOK_VERIFY_TOKEN=<your_verify_token>
WEBHOOK_HMAC_SECRET=<your_hmac_secret>
MCP_ENDPOINT=https://moments.unamifoundation.org/mcp
INTERNAL_WEBHOOK_SECRET=<your_internal_secret>
```

## 📊 VERIFICATION QUERIES

### Check Tables Exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('messages', 'moments', 'subscriptions', 'admin_users', 'moderation_audit');
```

### Check Admin User:
```sql
SELECT email, name, active FROM admin_users 
WHERE email = 'info@unamifoundation.org';
```

### Check Storage Bucket:
```sql
SELECT * FROM storage.buckets WHERE name = 'media';
```

### Check Edge Functions:
```bash
supabase functions list
```

## 🚀 DEPLOYMENT ORDER

1. **Database Schema** (SQL Editor):
   - Apply core schema files
   - Create admin user
   - Set up storage bucket

2. **Edge Functions** (CLI):
   - Set environment variables
   - Deploy all functions

3. **Verification**:
   - Run verification queries
   - Test admin login
   - Test webhook endpoints

## ⚠️ IMPORTANT NOTES

- Replace `$2b$10$placeholder_hash_replace_with_real_bcrypt` with actual bcrypt hash
- Ensure all environment variables are set before deploying functions
- Test each function after deployment
- Verify RLS policies are working correctly