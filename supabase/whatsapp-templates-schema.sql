-- WhatsApp Business API Template Compliance Schema
-- Tracks template messages, approvals, and delivery status

-- Template message tracking table
CREATE TABLE IF NOT EXISTS template_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    template_name TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    parameters JSONB DEFAULT '[]',
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    whatsapp_message_id TEXT,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Template definitions and approval status
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('UTILITY', 'MARKETING', 'AUTHENTICATION')),
    language_code TEXT DEFAULT 'en',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
    components JSONB NOT NULL,
    whatsapp_template_id TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- 24-hour messaging window tracking
CREATE TABLE IF NOT EXISTS messaging_windows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    last_user_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    window_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(phone_number)
);

-- Broadcast compliance tracking
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS template_used TEXT;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending_review'));
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS error_details JSONB;

-- Subscription consent tracking (GDPR/POPIA compliance)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS consent_method TEXT; -- 'whatsapp_optin', 'web_form', 'sms', etc.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS consent_ip_address INET;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS double_opt_in_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS double_opt_in_token TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_messages_phone ON template_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_template_messages_created_at ON template_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_template_messages_status ON template_messages(status);
CREATE INDEX IF NOT EXISTS idx_messaging_windows_phone ON messaging_windows(phone_number);
CREATE INDEX IF NOT EXISTS idx_messaging_windows_expires ON messaging_windows(window_expires_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON whatsapp_templates(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);

-- Insert default templates
INSERT INTO whatsapp_templates (name, category, components, status) VALUES
('welcome_confirmation', 'UTILITY', '[
  {
    "type": "BODY",
    "text": "Welcome to Unami Foundation Moments! 🌟\n\nYou are now subscribed to community updates for {{1}}.\n\nCategories: {{2}}\n\nReply STOP anytime to unsubscribe."
  },
  {
    "type": "FOOTER", 
    "text": "Unami Foundation - Empowering Communities"
  }
]', 'pending'),

('unsubscribe_confirmation', 'UTILITY', '[
  {
    "type": "BODY",
    "text": "You have been unsubscribed from Unami Foundation Moments.\n\nReply START anytime to resubscribe.\n\nThank you for being part of our community! 🙏"
  }
]', 'pending'),

('moment_broadcast', 'MARKETING', '[
  {
    "type": "HEADER",
    "format": "TEXT",
    "text": "{{1}} Moment — {{2}}"
  },
  {
    "type": "BODY",
    "text": "{{3}}\n\n{{4}}\n\n🏷️ {{5}} • 📍 {{6}}"
  },
  {
    "type": "FOOTER",
    "text": "Reply STOP to unsubscribe"
  },
  {
    "type": "BUTTONS",
    "buttons": [
      {
        "type": "URL",
        "text": "Read More",
        "url": "{{7}}"
      }
    ]
  }
]', 'pending'),

('sponsored_moment', 'MARKETING', '[
  {
    "type": "HEADER",
    "format": "TEXT", 
    "text": "{{1}} [Sponsored] Moment — {{2}}"
  },
  {
    "type": "BODY",
    "text": "{{3}}\n\n{{4}}\n\n🏷️ {{5}} • 📍 {{6}}\n\n✨ Proudly sponsored by {{7}}"
  },
  {
    "type": "FOOTER",
    "text": "Reply STOP to unsubscribe"
  },
  {
    "type": "BUTTONS",
    "buttons": [
      {
        "type": "URL",
        "text": "Learn More", 
        "url": "{{8}}"
      }
    ]
  }
]', 'pending'),

('subscription_preferences', 'UTILITY', '[
  {
    "type": "BODY",
    "text": "Manage your Unami Foundation Moments preferences:\n\nCurrent region: {{1}}\nCategories: {{2}}\n\nUse the buttons below to update your preferences."
  },
  {
    "type": "BUTTONS",
    "buttons": [
      {
        "type": "QUICK_REPLY",
        "text": "Change Region"
      },
      {
        "type": "QUICK_REPLY",
        "text": "Update Categories"
      },
      {
        "type": "QUICK_REPLY", 
        "text": "Unsubscribe"
      }
    ]
  }
]', 'pending')

ON CONFLICT (name) DO NOTHING;

-- Function to update messaging window
CREATE OR REPLACE FUNCTION update_messaging_window(user_phone TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO messaging_windows (phone_number, last_user_message_at, window_expires_at)
    VALUES (user_phone, NOW(), NOW() + INTERVAL '24 hours')
    ON CONFLICT (phone_number) 
    DO UPDATE SET 
        last_user_message_at = NOW(),
        window_expires_at = NOW() + INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is within 24-hour window
CREATE OR REPLACE FUNCTION is_within_messaging_window(user_phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    window_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT window_expires_at INTO window_expires
    FROM messaging_windows 
    WHERE phone_number = user_phone;
    
    IF window_expires IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN window_expires > NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update messaging window when user sends message
CREATE OR REPLACE FUNCTION trigger_update_messaging_window()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_messaging_window(NEW.from_number);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_messaging_window_trigger ON messages;
CREATE TRIGGER update_messaging_window_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_messaging_window();

-- RLS policies for template tables
ALTER TABLE template_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_windows ENABLE ROW LEVEL SECURITY;

-- Admin access policies
DROP POLICY IF EXISTS "Admin full access to template_messages" ON template_messages;
CREATE POLICY "Admin full access to template_messages" ON template_messages
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admin full access to whatsapp_templates" ON whatsapp_templates;
CREATE POLICY "Admin full access to whatsapp_templates" ON whatsapp_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admin full access to messaging_windows" ON messaging_windows;
CREATE POLICY "Admin full access to messaging_windows" ON messaging_windows
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role access for API operations
DROP POLICY IF EXISTS "Service role access to template_messages" ON template_messages;
CREATE POLICY "Service role access to template_messages" ON template_messages
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access to whatsapp_templates" ON whatsapp_templates;
CREATE POLICY "Service role access to whatsapp_templates" ON whatsapp_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access to messaging_windows" ON messaging_windows;
CREATE POLICY "Service role access to messaging_windows" ON messaging_windows
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');