# WhatsApp Webhook Configuration Update Required

## Current Issue
WhatsApp Business API is configured to send webhooks to:
```
https://arqeiadudzwbmzdhqkit.supabase.co/functions/v1/webhook
```

But our actual webhook handler is deployed at:
```
https://moments-api.unamifoundation.org/webhook
```

## Required Action
Update the WhatsApp Business API webhook configuration:

### 1. In Meta Business Manager / WhatsApp Business API Dashboard:
- Go to **App Settings** → **WhatsApp** → **Configuration**
- Update **Callback URL** from:
  ```
  https://arqeiadudzwbmzdhqkit.supabase.co/functions/v1/webhook
  ```
  To:
  ```
  https://moments-api.unamifoundation.org/webhook
  ```

### 2. Keep Current Settings:
- **Verify Token**: Keep your current verify token (matches `WEBHOOK_VERIFY_TOKEN` in .env)
- **Webhook Fields**: Keep only "messages" subscribed ✅
- **Version**: Keep v24.0 ✅

### 3. Test Webhook:
After updating, test the webhook by:
1. Click "Test" button next to the messages field
2. Send a test message to +27 65 829 5041
3. Check server logs for successful webhook processing

## Verification
Once updated, webhooks will be processed by our platform at:
- **Webhook Handler**: `/src/webhook.js`
- **Verification**: `GET /webhook` with hub.challenge
- **Processing**: `POST /webhook` with message data
- **Security**: HMAC signature verification enabled

## Current Webhook Features
✅ Message processing and storage
✅ MCP content moderation
✅ NGO-compliant template responses
✅ 24-hour messaging window tracking
✅ Opt-in/opt-out handling
✅ Media download and storage
✅ Multi-language support
✅ n8n workflow integration