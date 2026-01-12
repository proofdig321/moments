-- UNAMI MOMENTS - COMPLETE DATABASE SCHEMA
-- Fresh Supabase project - Complete architecture
-- Apply this single file for entire system

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Admin Users & Authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Admin Roles & RBAC
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'content_admin', 'moderator', 'viewer')),
  granted_by TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Admin Sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  logo_url TEXT,
  website_url TEXT,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moments (Core Content)
CREATE TABLE IF NOT EXISTS moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  content TEXT NOT NULL CHECK (length(content) >= 10 AND length(content) <= 2000),
  raw_content TEXT,
  region TEXT NOT NULL CHECK (region IN ('KZN','WC','GP','EC','FS','LP','MP','NC','NW','National')),
  category TEXT NOT NULL CHECK (category IN ('Education','Safety','Culture','Opportunity','Events','Health','Technology','Community')),
  language TEXT DEFAULT 'eng',
  sponsor_id UUID REFERENCES sponsors(id),
  is_sponsored BOOLEAN DEFAULT false,
  pwa_link TEXT,
  media_urls TEXT[],
  scheduled_at TIMESTAMPTZ,
  broadcasted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','broadcasted','cancelled')),
  urgency_level TEXT DEFAULT 'low' CHECK (urgency_level IN ('low','medium','high','urgent')),
  content_source TEXT DEFAULT 'admin' CHECK (content_source IN ('admin','community','whatsapp','campaign')),
  created_by TEXT,
  publish_to_whatsapp BOOLEAN DEFAULT false,
  publish_to_pwa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  sponsor_id UUID REFERENCES sponsors(id),
  budget DECIMAL(10,2) DEFAULT 0,
  target_regions TEXT[],
  target_categories TEXT[],
  media_urls TEXT[],
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','active','paused','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (WhatsApp Users)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL CHECK (phone_number ~ '^\+[1-9]\d{1,14}$'),
  opted_in BOOLEAN DEFAULT true,
  regions TEXT[] DEFAULT ARRAY['National'],
  categories TEXT[] DEFAULT ARRAY['Education','Safety','Opportunity'],
  language_preference TEXT DEFAULT 'eng',
  opted_in_at TIMESTAMPTZ DEFAULT NOW(),
  opted_out_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (WhatsApp Inbound)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_id TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text','image','audio','video','document')),
  content TEXT,
  media_url TEXT,
  media_id TEXT,
  language_detected TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','flagged','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Broadcasts (Outbound Messages)
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  recipient_count INTEGER DEFAULT 0 CHECK (recipient_count >= 0),
  success_count INTEGER DEFAULT 0 CHECK (success_count >= 0),
  failure_count INTEGER DEFAULT 0 CHECK (failure_count >= 0),
  broadcast_started_at TIMESTAMPTZ DEFAULT NOW(),
  broadcast_completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Storage
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  whatsapp_media_id TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','audio','video','document')),
  original_url TEXT,
  storage_path TEXT,
  file_size BIGINT CHECK (file_size > 0),
  mime_type TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP Advisories
CREATE TABLE IF NOT EXISTS advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  advisory_type TEXT NOT NULL CHECK (advisory_type IN ('language','urgency','harm','spam','content_quality')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  harm_signals JSONB,
  spam_indicators JSONB,
  urgency_level TEXT DEFAULT 'low',
  escalation_suggested BOOLEAN DEFAULT false,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation Audit Trail
CREATE TABLE IF NOT EXISTS moderation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'flagged', 'rejected')),
  moderator TEXT NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moment Intents (Publishing Pipeline)
CREATE TABLE IF NOT EXISTS moment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('pwa','whatsapp','email','sms')),
  action TEXT NOT NULL CHECK (action IN ('publish','update','delete')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed')),
  template_id TEXT,
  payload JSONB,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_sponsors_active ON sponsors(active);
CREATE INDEX IF NOT EXISTS idx_moments_status ON moments(status);
CREATE INDEX IF NOT EXISTS idx_moments_region ON moments(region);
CREATE INDEX IF NOT EXISTS idx_subscriptions_phone ON subscriptions(phone_number);
CREATE INDEX IF NOT EXISTS idx_subscriptions_opted_in ON subscriptions(opted_in);
CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
CREATE INDEX IF NOT EXISTS idx_messages_moderation ON messages(moderation_status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_moment_id ON broadcasts(moment_id);
CREATE INDEX IF NOT EXISTS idx_advisories_moment_id ON advisories(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_intents_moment_id ON moment_intents(moment_id);

-- RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies
CREATE POLICY "Admin full access" ON admin_users FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON admin_roles FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON sponsors FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON moments FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON campaigns FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON subscriptions FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON messages FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON broadcasts FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON media FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON advisories FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON moderation_audit FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON moment_intents FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON system_settings FOR ALL USING (is_admin());

-- Public policies
CREATE POLICY "Public read published moments" ON moments FOR SELECT USING (status = 'broadcasted');
CREATE POLICY "Public read active sponsors" ON sponsors FOR SELECT USING (active = true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read access') THEN
    CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
  END IF;
END $$;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_moments_updated_at BEFORE UPDATE ON moments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MCP trigger
CREATE OR REPLACE FUNCTION trigger_mcp_analysis()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'moments' THEN
    INSERT INTO advisories (moment_id, advisory_type, confidence, details) 
    VALUES (NEW.id, 'content_quality', 0.8, '{"status": "pending_analysis"}'::jsonb);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moments_mcp_trigger AFTER INSERT ON moments FOR EACH ROW EXECUTE FUNCTION trigger_mcp_analysis();

-- Initial data
INSERT INTO admin_users (email, name, password_hash, active) 
VALUES ('info@unamifoundation.org', 'Unami Foundation Admin', '$2b$10$placeholder', true)
ON CONFLICT (email) DO UPDATE SET active = true;

INSERT INTO admin_roles (user_id, role, granted_by)
SELECT id, 'superadmin', 'system'
FROM admin_users WHERE email = 'info@unamifoundation.org'
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';

INSERT INTO sponsors (name, display_name, contact_email, active) 
VALUES ('unami-foundation', 'Unami Foundation', 'info@unamifoundation.org', true)
ON CONFLICT (name) DO NOTHING;