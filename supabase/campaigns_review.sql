-- Campaigns Review & RBAC Setup for Unami Foundation Moments
-- This file implements proper role-based access control

-- Create admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','content_admin','moderator','viewer')),
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role)
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook security table
CREATE TABLE IF NOT EXISTS webhook_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  service TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Add RLS to new tables
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_tokens ENABLE ROW LEVEL SECURITY;

-- Create proper admin check function
CREATE OR REPLACE FUNCTION check_admin_role(required_role TEXT DEFAULT 'content_admin')
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID;
  has_role BOOLEAN := FALSE;
BEGIN
  -- Get current user from JWT
  user_uuid := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
  
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has required role or higher
  SELECT EXISTS(
    SELECT 1 FROM admin_roles 
    WHERE user_id = user_uuid 
    AND role = required_role 
    AND active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_role;
  
  RETURN has_role;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  user_uuid UUID;
BEGIN
  user_uuid := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
  
  INSERT INTO audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    user_uuid,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create webhook verification function
CREATE OR REPLACE FUNCTION verify_webhook_token(token TEXT, service_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  token_valid BOOLEAN := FALSE;
BEGIN
  -- Check if token exists and is active
  SELECT EXISTS(
    SELECT 1 FROM webhook_tokens 
    WHERE token_hash = encode(digest(token, 'sha256'), 'hex')
    AND service = service_name
    AND active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO token_valid;
  
  -- Update last_used if valid
  IF token_valid THEN
    UPDATE webhook_tokens 
    SET last_used = NOW() 
    WHERE token_hash = encode(digest(token, 'sha256'), 'hex');
  END IF;
  
  RETURN token_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_moments ON moments;
CREATE TRIGGER audit_moments
  AFTER INSERT OR UPDATE OR DELETE ON moments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_sponsors ON sponsors;
CREATE TRIGGER audit_sponsors
  AFTER INSERT OR UPDATE OR DELETE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_system_settings ON system_settings;
CREATE TRIGGER audit_system_settings
  AFTER INSERT OR UPDATE OR DELETE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_roles(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_tokens_hash ON webhook_tokens(token_hash);

-- Insert default admin role (replace with actual user ID)
INSERT INTO admin_roles (user_id, role, granted_by) 
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, 
  'super_admin', 
  '00000000-0000-0000-0000-000000000000'::uuid
) ON CONFLICT (user_id, role) DO NOTHING;

-- Insert webhook token for WhatsApp (replace with actual token hash)
INSERT INTO webhook_tokens (token_hash, service) 
VALUES (
  encode(digest('whatsapp_gateway_verify_2024_secure', 'sha256'), 'hex'),
  'whatsapp'
) ON CONFLICT (token_hash) DO NOTHING;