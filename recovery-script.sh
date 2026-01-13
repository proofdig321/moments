#!/bin/bash

# 🚀 MOMENTS SYSTEM RECOVERY SCRIPT
# This script updates all configuration files with new Supabase project details

echo "🔧 Moments System Recovery Script"
echo "================================="

# Check if required parameters are provided
if [ $# -lt 3 ]; then
    echo "❌ Usage: $0 <NEW_PROJECT_ID> <NEW_ANON_KEY> <NEW_SERVICE_KEY> [NEW_VERCEL_URL]"
    echo ""
    echo "Example:"
    echo "  $0 abcdefghijklmnop eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9... eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    echo ""
    echo "Get these values from your new Supabase project:"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Create new project"
    echo "  3. Go to Settings > API"
    echo "  4. Copy Project URL, anon key, and service_role key"
    exit 1
fi

NEW_PROJECT_ID="$1"
NEW_ANON_KEY="$2"
NEW_SERVICE_KEY="$3"
NEW_VERCEL_URL="${4:-https://moments-new.vercel.app}"

OLD_PROJECT_ID="bxmdzxejcxbinghtytfw"
NEW_SUPABASE_URL="https://${NEW_PROJECT_ID}.supabase.co"

echo "📋 Configuration:"
echo "  Old Project ID: $OLD_PROJECT_ID"
echo "  New Project ID: $NEW_PROJECT_ID"
echo "  New Supabase URL: $NEW_SUPABASE_URL"
echo "  New Vercel URL: $NEW_VERCEL_URL"
echo ""

# Backup original files
echo "💾 Creating backups..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
cp vercel.json vercel.json.backup.$(date +%Y%m%d_%H%M%S)
cp public/js/admin.js public/js/admin.js.backup.$(date +%Y%m%d_%H%M%S)

# Update .env file
echo "🔧 Updating .env file..."
sed -i.bak "s|SUPABASE_URL=https://${OLD_PROJECT_ID}.supabase.co|SUPABASE_URL=${NEW_SUPABASE_URL}|g" .env
sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=${NEW_ANON_KEY}|g" .env
sed -i.bak "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=${NEW_SERVICE_KEY}|g" .env

# Update vercel.json
echo "🔧 Updating vercel.json..."
sed -i.bak "s|https://${OLD_PROJECT_ID}.supabase.co|${NEW_SUPABASE_URL}|g" vercel.json

# Update admin.js
echo "🔧 Updating admin.js..."
sed -i.bak "s|https://.*\.supabase\.co/functions/v1/admin-api|${NEW_SUPABASE_URL}/functions/v1/admin-api|g" public/js/admin.js

# Update any other files that might contain the old URL
echo "🔧 Updating other configuration files..."
find . -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | \
    grep -v node_modules | \
    grep -v .git | \
    xargs sed -i.bak "s|${OLD_PROJECT_ID}|${NEW_PROJECT_ID}|g" 2>/dev/null || true

# Clean up backup files
rm -f .env.bak vercel.json.bak public/js/admin.js.bak
find . -name "*.bak" -delete 2>/dev/null || true

echo ""
echo "✅ Configuration files updated successfully!"
echo ""

# Verify changes
echo "🔍 Verifying changes..."
echo "  .env SUPABASE_URL: $(grep SUPABASE_URL .env)"
echo "  vercel.json contains: $(grep -c "$NEW_PROJECT_ID" vercel.json) references"
echo "  admin.js contains: $(grep -c "$NEW_PROJECT_ID" public/js/admin.js) references"
echo ""

# Next steps
echo "📋 NEXT STEPS:"
echo "=============="
echo ""
echo "1. 🗄️  Deploy Database Schema:"
echo "   supabase link --project-ref $NEW_PROJECT_ID"
echo "   supabase db push"
echo "   # OR manually run: psql -h db.$NEW_PROJECT_ID.supabase.co -U postgres -d postgres -f supabase/CLEAN_SCHEMA.sql"
echo ""
echo "2. ⚡ Deploy Edge Functions:"
echo "   supabase functions deploy admin-api --project-ref $NEW_PROJECT_ID"
echo "   supabase functions deploy webhook --project-ref $NEW_PROJECT_ID"
echo ""
echo "3. 🔐 Set Edge Function Secrets:"
echo "   supabase secrets set WHATSAPP_TOKEN=\$WHATSAPP_TOKEN --project-ref $NEW_PROJECT_ID"
echo "   supabase secrets set WEBHOOK_VERIFY_TOKEN=\$WEBHOOK_VERIFY_TOKEN --project-ref $NEW_PROJECT_ID"
echo "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=\$NEW_SERVICE_KEY --project-ref $NEW_PROJECT_ID"
echo ""
echo "4. 🚀 Deploy Frontend:"
echo "   vercel --prod"
echo "   # Set environment variables in Vercel dashboard"
echo ""
echo "5. 🧪 Test System:"
echo "   ./comprehensive-test.sh"
echo ""
echo "6. 📱 Update WhatsApp Webhook URL:"
echo "   Update webhook URL in WhatsApp Business API to: \$NEW_VERCEL_URL/webhook"
echo ""

# Create a quick test script
cat > quick-test.sh << EOF
#!/bin/bash
echo "🧪 Quick System Test"
echo "==================="

echo -n "Testing Supabase connection... "
if curl -s "${NEW_SUPABASE_URL}/functions/v1/admin-api/analytics" | grep -q "error\\|Unauthorized"; then
    echo "✅ Supabase responding"
else
    echo "❌ Supabase not responding"
fi

echo -n "Testing admin login... "
response=\$(curl -s -X POST -H "Content-Type: application/json" \\
    -d '{"email":"info@unamifoundation.org","password":"Proof321#"}' \\
    "${NEW_SUPABASE_URL}/functions/v1/admin-api")

if echo "\$response" | grep -q "token"; then
    echo "✅ Login working"
else
    echo "❌ Login failed"
fi

echo ""
echo "🔗 Test URLs:"
echo "  Admin Dashboard: $NEW_VERCEL_URL/admin-dashboard.html"
echo "  Public Moments: $NEW_VERCEL_URL/moments"
echo "  Admin API: ${NEW_SUPABASE_URL}/functions/v1/admin-api"
echo "  Webhook: ${NEW_SUPABASE_URL}/functions/v1/webhook"
EOF

chmod +x quick-test.sh

echo "💡 Created quick-test.sh for testing after deployment"
echo ""
echo "🎉 Recovery script completed! Follow the next steps above to complete the recovery."