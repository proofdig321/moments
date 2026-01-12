# Integration Test - All Systems

## Test Flow
WhatsApp → Gateway → MCP Railway → n8n → Supabase

## 1. Start All Services
```bash
# Terminal 1: Start n8n
cd n8n-local && ./start.sh

# Terminal 2: Deploy MCP to Railway  
cd mcp-railway && ./deploy.sh

# Terminal 3: Start Gateway
npm start
```

## 2. Test Message Flow
```bash
# Send test webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "test123",
            "from": "27123456789", 
            "type": "text",
            "text": {"body": "Hello urgent help needed"},
            "timestamp": "1640995200"
          }]
        }
      }]
    }]
  }'
```

## 3. Verify Integration Points

### ✅ Gateway → MCP Railway
- Gateway calls `MCP_ENDPOINT/advisory`
- MCP returns advisory JSON
- Advisory stored in Supabase `advisories` table

### ✅ Gateway → n8n Local  
- Gateway posts to `N8N_WEBHOOK_URL/whatsapp-inbound`
- n8n workflow processes message data
- n8n logs escalations to Supabase `flags` table

### ✅ All → Supabase
- Messages stored in `messages` table
- Media stored in storage buckets
- Advisories logged in `advisories` table  
- Flags logged in `flags` table

## 4. Check Results
```sql
-- In Supabase SQL Editor
SELECT * FROM messages WHERE whatsapp_id = 'test123';
SELECT * FROM advisories WHERE message_id = (SELECT id FROM messages WHERE whatsapp_id = 'test123');
SELECT * FROM flags WHERE message_id = (SELECT id FROM messages WHERE whatsapp_id = 'test123');
```

**✅ INTEGRATION COMPLETE - NO LOOSE ENDS**