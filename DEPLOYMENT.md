# WhatsApp Community Gateway - Deployment Guide

## Prerequisites

1. **WhatsApp Business Account**
   - Business verification completed
   - Phone number registered
   - Access token generated
   - Webhook URL configured

2. **Supabase Project**
   - New project created
   - Database URL and service key available
   - Storage buckets enabled

3. **n8n Instance**
   - Self-hosted or cloud instance
   - Webhook endpoints accessible
   - Supabase credentials configured

4. **MCP Endpoint**
   - Advisory intelligence service running
   - Endpoint URL accessible from gateway

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
WHATSAPP_TOKEN=your_business_access_token
WHATSAPP_PHONE_ID=your_phone_number_id
WEBHOOK_VERIFY_TOKEN=random_secure_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/whatsapp-inbound
MCP_ENDPOINT=https://your-mcp-service.com/advisory
PORT=3000
```

## Database Setup

1. Run the schema in Supabase SQL editor:
```bash
cat supabase/schema.sql | supabase db reset --db-url $SUPABASE_URL
```

2. Verify tables and storage buckets are created

## n8n Workflow Import

1. Import workflows from `n8n/` directory
2. Configure Supabase credentials in n8n
3. Test webhook endpoints
4. Activate workflows

## WhatsApp Configuration

1. Set webhook URL: `https://moments.unamfoundation.org/webhook` (update DNS and TLS for this subdomain)
2. Set verify token from your `.env`
3. Subscribe to message events
4. Test with a message

## Production Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Process Manager

```bash
npm install -g pm2
pm2 start src/server.js --name whatsapp-gateway
pm2 save
pm2 startup
```

- Monitoring

- Health check: `GET /health` (e.g., https://moments.unamfoundation.org/health)
- Logs: Check console output and Supabase flags table
- Media processing: Monitor storage bucket usage
- n8n workflows: Check execution logs

## Troubleshooting

1. **Webhook not receiving messages**
   - Verify WhatsApp webhook configuration
   - Check HTTPS certificate
   - Confirm verify token matches

2. **Media processing failures**
   - Check Supabase storage permissions
   - Verify WhatsApp token has media access
   - Monitor storage bucket limits

3. **MCP advisory failures**
   - Check MCP endpoint availability
   - Verify request/response format
   - Review timeout settings

4. **n8n workflow issues**
   - Check webhook URL accessibility
   - Verify Supabase credentials
   - Monitor execution logs