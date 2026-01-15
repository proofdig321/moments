# Deploy broadcast-webhook Function

## Issue
The broadcast-webhook function shows NO LOGS when called by admin-api, indicating it's not deployed or has a critical initialization error.

## Solution: Deploy via Supabase Dashboard

### Step 1: Navigate to Edge Functions
1. Go to: https://supabase.com/dashboard/project/bxmdzcxejcxbinghtyfw/functions
2. Find `broadcast-webhook` in the list

### Step 2: Deploy New Version
**Option A: Via Dashboard UI**
1. Click on `broadcast-webhook`
2. Click "Deploy new version"
3. Copy the entire content from `/workspaces/moments/supabase/functions/broadcast-webhook/index.ts`
4. Paste into the code editor
5. Click "Deploy"

**Option B: Via Supabase CLI (if available)**
```bash
cd /workspaces/moments
supabase functions deploy broadcast-webhook --no-verify-jwt
```

### Step 3: Verify Deployment
After deployment, check:
1. Function version number increments
2. Initialization log appears: `🚀 broadcast-webhook function initializing...`
3. Test by broadcasting a campaign

### Step 4: Test Broadcast
1. Go to admin dashboard: https://moments.unamfoundation.org
2. Create/edit a campaign
3. Click "Broadcast Now"
4. Check logs in Supabase Dashboard → Edge Functions → broadcast-webhook → Logs

## Expected Log Output
When working correctly, you should see:
```
🚀 broadcast-webhook function initializing...
📨 Request received: POST /
📢 Starting broadcast {broadcast_id}
   - Message length: X chars
   - Recipients: Y
📱 WhatsApp send attempt 1/3 to {phone}
✅ WhatsApp message sent to {phone}: {message_id}
✅ Broadcast {broadcast_id} completed in Xms
   - Success: Y/Y
   - Failed: 0/Y
```

## Current Status
- ✅ admin-api is deployed and working (version 48)
- ❌ broadcast-webhook shows NO LOGS (not deployed or initialization error)
- ✅ Moment creation works
- ❌ WhatsApp broadcast fails silently

## Environment Variables Required
Ensure these are set in Supabase Dashboard → Settings → Edge Functions → Secrets:
- `WHATSAPP_TOKEN` - Meta Business API token
- `WHATSAPP_PHONE_ID` - WhatsApp Business phone number ID
- `SUPABASE_URL` - Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided
