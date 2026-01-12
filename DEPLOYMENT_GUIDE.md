# 🚀 DEPLOYMENT PREPARATION - Manual Steps

**Status**: Smoke tests show environment variables missing (expected in Codespaces)  
**Ready for**: Manual deployment with proper environment setup

## ✅ VERIFIED READY COMPONENTS

- **Webhook endpoint**: ✅ Responding correctly
- **Critical files**: ✅ All present and correct
- **Repository state**: ✅ Secrets protected, correct branch
- **Code fixes**: ✅ Subscription commands, moderation actions, HMAC verification

## 🔧 MANUAL DEPLOYMENT STEPS

### Step 1: Environment Setup (CRITICAL)
```bash
# In Vercel Dashboard - Set these environment variables:
WHATSAPP_TOKEN=<new_rotated_token>
WHATSAPP_PHONE_ID=940140815849209
WHATSAPP_BUSINESS_ACCOUNT_ID=918577797187335
WEBHOOK_VERIFY_TOKEN=<new_verify_token>
SUPABASE_URL=https://bxmdzxejcxbinghtytw.supabase.co
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_KEY=<new_rotated_service_key>
WEBHOOK_HMAC_SECRET=<new_hmac_secret>
INTERNAL_WEBHOOK_SECRET=<new_internal_secret>
N8N_WEBHOOK_URL=https://moments.unamifoundation.org/webhook
MCP_ENDPOINT=https://moments.unamifoundation.org/mcp
PORT=8080
NODE_ENV=production
JWT_SECRET=<new_jwt_secret>
ADMIN_PASSWORD=<new_secure_password>
```

### Step 2: Database Migration
```sql
-- Run in Supabase SQL Editor:
-- Add moderation status to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create moderation audit table
CREATE TABLE IF NOT EXISTS moderation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'flagged', 'rejected')),
  moderator TEXT NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_moderation_status ON messages(moderation_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_opted_in ON subscriptions(opted_in);
```

### Step 3: Deploy Edge Functions
```bash
# In Supabase CLI (after setting environment variables):
supabase functions deploy webhook
supabase functions deploy admin-api
supabase functions deploy handleMomentCreated
```

### Step 4: Update WhatsApp Webhook URL
```
# In Meta Business Manager:
# Update webhook URL to: https://moments.unamifoundation.org/webhook
# Update verify token to match WEBHOOK_VERIFY_TOKEN
```

### Step 5: Verification Tests
```bash
# Test subscription command:
curl -X POST https://moments.unamifoundation.org/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"id":"test","from":"27123456789","text":{"body":"START"},"timestamp":"1234567890"}]}}]}]}'

# Test moderation action:
curl -X POST https://moments.unamifoundation.org/admin/messages/123/approve \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"

# Test HMAC verification:
curl -X POST https://moments.unamifoundation.org/webhook \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -H "Content-Type: application/json" \
  -d '{}' 
# Should return 403 Forbidden
```

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] All tokens rotated (WhatsApp, Supabase, HMAC, JWT)
- [ ] Environment variables set in Vercel
- [ ] Database migration applied in Supabase
- [ ] Edge functions deployed with new env vars
- [ ] WhatsApp webhook URL updated in Meta

### Post-Deployment:
- [ ] Webhook verification working (GET request)
- [ ] Subscription commands working (START/STOP)
- [ ] Moderation actions working (Approve/Flag)
- [ ] HMAC verification blocking invalid requests
- [ ] Admin dashboard accessible

### Rollback Plan:
- [ ] Previous environment variables backed up
- [ ] Database migration rollback script ready
- [ ] Previous edge function versions tagged
- [ ] Monitoring alerts configured

## 🎯 SUCCESS CRITERIA

1. **Security**: No secrets in repository, HMAC verification working
2. **Functionality**: START/STOP commands update database, moderation actions change status
3. **Monitoring**: Error rates < 5%, response times < 2s
4. **User Experience**: Admin dashboard working, PWA displaying moments

---

**Status**: Ready for manual deployment following security-first approach from SYSTEM.md playbook.