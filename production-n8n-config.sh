#!/bin/bash

echo "🔧 PRODUCTION N8N CONFIGURATION"
echo "==============================="

echo "❌ REMOVING LOCAL N8N SETUP (not needed for production)"
rm -rf n8n-local

echo ""
echo "✅ PRODUCTION SYSTEM STATUS:"
echo "----------------------------"
echo "🌐 Admin Dashboard: https://moments.unamifoundation.org"
echo "🔑 Production Login: info@unamifoundation.org / Proof321#"
echo "📊 Database: Supabase (operational)"
echo "🔧 Admin API: Deployed to Supabase Functions"
echo "💾 Storage: Supabase Storage buckets ready"

echo ""
echo "🎯 FOR YOUR PRODUCTION N8N:"
echo "---------------------------"
echo "Add these environment variables to your production n8n:"

cat > n8n-production-env.txt << 'EOF'
# Production n8n Environment Variables
SUPABASE_URL=https://arqeiadudzwbmzdhqkit.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8
WHATSAPP_TOKEN=EAAVqvFzqn6UBQQ2WZCLcPkz5fSN1qGDoZBy4Q2deJZBli15YUbno0jMZCwWf3t48pXkHKeb7KfdTgTrdJE7yd4eZB9AgulbQOMgqyZCDFpZCZAKbqZAIhqGE7tmgiZAbDZC3t4qivIlI59Na1ZA1zcps3TEhzAd4Em1aZB7haiXJZBdyvCniTocju8tqXiYuvElmnclwZDZD
PHONE_NUMBER_ID=997749243410302
EOF

echo "📝 Environment variables saved to: n8n-production-env.txt"

echo ""
echo "🚀 PRODUCTION DEPLOYMENT STEPS:"
echo "1. Import n8n/intent-executor-workflow.json to your production n8n"
echo "2. Add environment variables from n8n-production-env.txt"
echo "3. Activate the workflow"
echo "4. Test via https://moments.unamifoundation.org"

echo ""
echo "🧪 TEST THE SYSTEM:"
echo "1. Login: https://moments.unamifoundation.org"
echo "2. Use: info@unamifoundation.org / Proof321#"
echo "3. Create moment with publish_to_whatsapp=true"
echo "4. Check n8n processes the intent"

echo ""
echo "✅ PRODUCTION CONFIGURATION COMPLETE"