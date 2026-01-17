-- Dynamic Authority Layer - Database Schema Migration
-- Phase 1.1: Create authority tables with indexes
-- Date: January 17, 2026
-- Status: SHADOW MODE - Zero production impact

-- Authority Profiles Table
CREATE TABLE IF NOT EXISTS authority_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL, -- phone number or user ID
  authority_level INTEGER DEFAULT 1 CHECK (authority_level BETWEEN 1 AND 5),
  role_label TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('school', 'community', 'region', 'province', 'national')),
  scope_identifier TEXT, -- specific school ID, region code, etc.
  approval_mode TEXT DEFAULT 'ai_review' CHECK (approval_mode IN ('auto', 'ai_review', 'admin_review')),
  blast_radius INTEGER DEFAULT 100 CHECK (blast_radius > 0),
  risk_threshold DECIMAL(3,2) DEFAULT 0.7 CHECK (risk_threshold BETWEEN 0 AND 1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Authority Audit Log Table
CREATE TABLE IF NOT EXISTS authority_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_profile_id UUID REFERENCES authority_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'suspended', 'expired', 'enforced')),
  actor_id UUID REFERENCES admin_users(id),
  context JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_authority_profiles_user_identifier ON authority_profiles(user_identifier);
CREATE INDEX IF NOT EXISTS idx_authority_profiles_status_valid ON authority_profiles(status, valid_until) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_authority_profiles_scope ON authority_profiles(scope, scope_identifier);
CREATE INDEX IF NOT EXISTS idx_authority_audit_log_profile_id ON authority_audit_log(authority_profile_id);
CREATE INDEX IF NOT EXISTS idx_authority_audit_log_timestamp ON authority_audit_log(timestamp DESC);

-- RLS Policies (Admin access only)
ALTER TABLE authority_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin full access policies
CREATE POLICY "Admin full access authority_profiles" ON authority_profiles FOR ALL USING (is_admin());
CREATE POLICY "Admin full access authority_audit_log" ON authority_audit_log FOR ALL USING (is_admin());

-- Update trigger for authority_profiles
CREATE TRIGGER update_authority_profiles_updated_at 
  BEFORE UPDATE ON authority_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Authority lookup function (optimized for performance)
CREATE OR REPLACE FUNCTION lookup_authority(p_user_identifier TEXT)
RETURNS TABLE (
  authority_level INTEGER,
  role_label TEXT,
  scope TEXT,
  scope_identifier TEXT,
  approval_mode TEXT,
  blast_radius INTEGER,
  risk_threshold DECIMAL(3,2),
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.authority_level,
    ap.role_label,
    ap.scope,
    ap.scope_identifier,
    ap.approval_mode,
    ap.blast_radius,
    ap.risk_threshold,
    ap.metadata
  FROM authority_profiles ap
  WHERE ap.user_identifier = p_user_identifier
    AND ap.status = 'active'
    AND (ap.valid_until IS NULL OR ap.valid_until > NOW())
  ORDER BY ap.authority_level DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Authority audit logging function
CREATE OR REPLACE FUNCTION log_authority_action(
  p_authority_profile_id UUID,
  p_action TEXT,
  p_actor_id UUID,
  p_context JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO authority_audit_log (authority_profile_id, action, actor_id, context)
  VALUES (p_authority_profile_id, p_action, p_actor_id, p_context)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test data for development (commented out for production)
/*
-- Sample authority profiles for testing
INSERT INTO authority_profiles (user_identifier, authority_level, role_label, scope, scope_identifier, approval_mode, blast_radius, created_by)
SELECT 
  '+27123456789', 3, 'School Principal', 'school', 'school_001', 'auto', 500,
  (SELECT id FROM admin_users WHERE email = 'info@unamifoundation.org' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM authority_profiles WHERE user_identifier = '+27123456789');

INSERT INTO authority_profiles (user_identifier, authority_level, role_label, scope, scope_identifier, approval_mode, blast_radius, created_by)
SELECT 
  '+27987654321', 2, 'Community Leader', 'community', 'soweto_001', 'ai_review', 200,
  (SELECT id FROM admin_users WHERE email = 'info@unamifoundation.org' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM authority_profiles WHERE user_identifier = '+27987654321');
*/

-- Verification queries
-- SELECT * FROM authority_profiles;
-- SELECT * FROM authority_audit_log;
-- SELECT * FROM lookup_authority('+27123456789');