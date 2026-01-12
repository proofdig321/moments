# 🚀 Quick Deployment Guide

## **Vercel Deployment** (Recommended)

### **1. Quick Deploy**
```bash
npm run deploy:vercel
```

### **2. Manual Deploy**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### **3. Environment Variables**
Set these in Vercel dashboard:
```
WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_ID=your_phone_id
WEBHOOK_VERIFY_TOKEN=your_verify_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
MCP_ENDPOINT=https://mcp-production.up.railway.app/advisory
NODE_ENV=production
```

## **Railway Deployment**

### **Deploy**
```bash
npm run deploy:railway
```

## **Database Setup**

### **Run in Supabase SQL Editor:**
1. `supabase/schema.sql`
2. `supabase/moments-schema.sql` 
3. `supabase/enhanced-schema.sql`
4. `supabase/system-settings.sql`

### Apply RBAC & Campaigns Migrations

You can apply RBAC and campaigns migrations using the helper script or via Supabase SQL Editor.

Using the script (requires `psql` and DB URL):

```bash
chmod +x ./scripts/apply_migrations.sh
./scripts/apply_migrations.sh "postgresql://user:pass@host:5432/postgres"
```

Or use the GitHub Actions manual workflow `Manual Migrations` in `.github/workflows/migrate.yml` (requires `SUPABASE_DB_URL` secret).

## **Post-Deployment**

1. Configure WhatsApp webhook to your domain
2. Test admin dashboard
3. Upload logo via Settings tab
4. Create first moment
5. Test broadcast functionality

## Sentry / Observability

To enable error monitoring with Sentry set the `SENTRY_DSN` environment variable in your deployment platform. The server will attach user context (when available) and capture errors.

Example env vars to add:

```
SENTRY_DSN=https://<PUBLIC_KEY>@o0.ingest.sentry.io/0
ADMIN_CSRF_TOKEN=your_csrf_token
INTERNAL_WEBHOOK_SECRET=internal-secret-for-n8n
WEBHOOK_HMAC_SECRET=your_hmac_secret
ADMIN_ORIGIN=https://your-admin-origin.example
```

## **Access Points**

- **Site / PWA**: `https://moments.unamfoundation.org`
- **Admin**: `https://moments.unamfoundation.org/admin.html`
- **Settings**: Settings tab in admin
- **Health**: `https://moments.unamfoundation.org/health`
- **Webhook**: `https://moments.unamfoundation.org/webhook`

**System is production-ready!** 🎉