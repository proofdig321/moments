-- RBAC Policies for Unami Foundation Moments
-- This file implements Row Level Security policies

-- Drop existing demo policies
DROP POLICY IF EXISTS "Admin full access" ON sponsors;
DROP POLICY IF EXISTS "Admin full access" ON moments;
DROP POLICY IF EXISTS "Admin full access" ON broadcasts;
DROP POLICY IF EXISTS "Admin full access" ON subscriptions;
DROP POLICY IF EXISTS "Admin manage settings" ON system_settings;

-- Sponsors table policies
CREATE POLICY "Super admin full access" ON sponsors
  FOR ALL USING (check_admin_role('super_admin'));

CREATE POLICY "Content admin read/write" ON sponsors
  FOR ALL USING (check_admin_role('content_admin'));

CREATE POLICY "Moderator read only" ON sponsors
  FOR SELECT USING (check_admin_role('moderator'));

-- Moments table policies
CREATE POLICY "Super admin full access" ON moments
  FOR ALL USING (check_admin_role('super_admin'));

CREATE POLICY "Content admin manage moments" ON moments
  FOR ALL USING (check_admin_role('content_admin'));

CREATE POLICY "Moderator review moments" ON moments
  FOR SELECT USING (check_admin_role('moderator'));

CREATE POLICY "Moderator update status" ON moments
  FOR UPDATE USING (check_admin_role('moderator'))
  WITH CHECK (check_admin_role('moderator'));

-- Broadcasts table policies
CREATE POLICY "Admin view broadcasts" ON broadcasts
  FOR SELECT USING (check_admin_role('content_admin'));

CREATE POLICY "Super admin manage broadcasts" ON broadcasts
  FOR ALL USING (check_admin_role('super_admin'));

-- Subscriptions table policies
CREATE POLICY "Admin view subscriptions" ON subscriptions
  FOR SELECT USING (check_admin_role('content_admin'));

CREATE POLICY "Super admin manage subscriptions" ON subscriptions
  FOR ALL USING (check_admin_role('super_admin'));

-- System settings policies
CREATE POLICY "Super admin manage settings" ON system_settings
  FOR ALL USING (check_admin_role('super_admin'));

CREATE POLICY "Content admin read settings" ON system_settings
  FOR SELECT USING (check_admin_role('content_admin'));

-- Admin roles policies
CREATE POLICY "Super admin manage roles" ON admin_roles
  FOR ALL USING (check_admin_role('super_admin'));

CREATE POLICY "Users view own roles" ON admin_roles
  FOR SELECT USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  );

-- Audit log policies
CREATE POLICY "Super admin view all audit" ON audit_log
  FOR SELECT USING (check_admin_role('super_admin'));

CREATE POLICY "Users view own audit" ON audit_log
  FOR SELECT USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  );

-- Webhook tokens policies
CREATE POLICY "Super admin manage tokens" ON webhook_tokens
  FOR ALL USING (check_admin_role('super_admin'));

-- Messages table policies (existing table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    DROP POLICY IF EXISTS "Admin view messages" ON messages;
    CREATE POLICY "Admin view messages" ON messages
      FOR SELECT USING (check_admin_role('moderator'));
    
    DROP POLICY IF EXISTS "Super admin manage messages" ON messages;
    CREATE POLICY "Super admin manage messages" ON messages
      FOR ALL USING (check_admin_role('super_admin'));
  END IF;
END $$;

-- Media table policies (existing table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
    DROP POLICY IF EXISTS "Admin view media" ON media;
    CREATE POLICY "Admin view media" ON media
      FOR SELECT USING (check_admin_role('moderator'));
    
    DROP POLICY IF EXISTS "Super admin manage media" ON media;
    CREATE POLICY "Super admin manage media" ON media
      FOR ALL USING (check_admin_role('super_admin'));
  END IF;
END $$;

-- Flags table policies (existing table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flags') THEN
    DROP POLICY IF EXISTS "Moderator view flags" ON flags;
    CREATE POLICY "Moderator view flags" ON flags
      FOR SELECT USING (check_admin_role('moderator'));
    
    DROP POLICY IF EXISTS "Admin manage flags" ON flags;
    CREATE POLICY "Admin manage flags" ON flags
      FOR ALL USING (check_admin_role('content_admin'));
  END IF;
END $$;

-- Advisories table policies (existing table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advisories') THEN
    DROP POLICY IF EXISTS "Moderator view advisories" ON advisories;
    CREATE POLICY "Moderator view advisories" ON advisories
      FOR SELECT USING (check_admin_role('moderator'));
    
    DROP POLICY IF EXISTS "Admin manage advisories" ON advisories;
    CREATE POLICY "Admin manage advisories" ON advisories
      FOR ALL USING (check_admin_role('content_admin'));
  END IF;
END $$;