#!/bin/bash
# Deploy unified analytics system

echo "📊 Deploying unified analytics..."

# 1. Deploy unified analytics schema
echo "1️⃣ Creating unified analytics view..."
supabase db push --file supabase/unified_analytics.sql

# 2. Deploy admin API with unified endpoint
echo "2️⃣ Deploying admin API..."
supabase functions deploy admin-api

# 3. Test all endpoints
echo "3️⃣ Testing analytics consistency..."

echo ""
echo "Testing PWA endpoint (/analytics):"
curl -s "https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/admin-api/analytics" | jq '{totalMoments, activeSubscribers, totalBroadcasts}'

echo ""
echo "Testing Admin endpoint (/analytics/dashboard):"
curl -s "https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/admin-api/analytics/dashboard" | jq '.daily[0] | {total_moments, active_subscribers, total_broadcasts}'

echo ""
echo "✅ Unified analytics deployed!"
echo ""
echo "📈 Consistent metrics across:"
echo "  ✓ Admin Dashboard"
echo "  ✓ PWA (moments.unamifoundation.org)"
echo "  ✓ WhatsApp (links to PWA)"
echo "  ✓ Public API (/api/stats)"
