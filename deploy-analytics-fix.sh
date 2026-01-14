#!/bin/bash
# Deploy analytics fix and marketing template analytics

echo "🔧 Deploying analytics fix..."

# 1. Deploy SQL migration
echo "📊 Running analytics migration..."
supabase db push --file supabase/fix_analytics.sql

# 2. Deploy admin API
echo "🚀 Deploying admin API..."
supabase functions deploy admin-api

# 3. Test analytics endpoint
echo "🧪 Testing analytics..."
curl -s "https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/admin-api/analytics/dashboard" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.daily[0], .adoption'

echo "✅ Analytics fix deployed!"
echo ""
echo "📈 New features:"
echo "  - Fixed empty analytics tables"
echo "  - Added template performance tracking"
echo "  - Added v2 adoption rate metric"
echo "  - Added compliance score in analytics"
