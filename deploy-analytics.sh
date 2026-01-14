#!/bin/bash
# Deploy analytics dashboard

echo "🚀 Deploying analytics schema..."
supabase db execute --file supabase/analytics_dashboard.sql

echo "🚀 Deploying analytics-refresh function..."
supabase functions deploy analytics-refresh

echo "🚀 Redeploying admin-api..."
supabase functions deploy admin-api

echo "🚀 Running initial refresh..."
curl -X POST "https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/analytics-refresh" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

echo ""
echo "✅ Analytics deployed!"
echo ""
echo "📊 Access: https://moments.unamifoundation.org/analytics.html"
echo ""
echo "🔧 Setup GitHub Actions cron (hourly refresh):"
echo "  Add to .github/workflows/analytics-refresh.yml"
