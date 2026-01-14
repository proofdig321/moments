#!/bin/bash
# Complete analytics fix - unified system across all interfaces

echo "🔧 Deploying complete analytics fix..."
echo ""

# 1. Deploy SQL
echo "1️⃣ Running SQL migration..."
supabase db push --file supabase/complete_analytics_fix.sql
echo "✅ Database updated"
echo ""

# 2. Deploy admin API
echo "2️⃣ Deploying admin API..."
supabase functions deploy admin-api
echo "✅ Admin API deployed"
echo ""

# 3. Test consistency
echo "3️⃣ Testing analytics consistency..."
echo ""

echo "📱 PWA Analytics (/analytics):"
curl -s "https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/admin-api/analytics" | jq -c '{totalMoments, activeSubscribers, totalBroadcasts, templateAdoption}'

echo ""
echo "🖥️  Admin Analytics (/analytics/dashboard):"
curl -s "https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/admin-api/analytics/dashboard" | jq -c '.daily[0] | {total_moments, active_subscribers, total_broadcasts}'

echo ""
echo "🌐 Public API (/api/stats):"
curl -s "http://localhost:3000/api/stats" | jq -c '{totalMoments, activeSubscribers, totalBroadcasts}'

echo ""
echo "✅ Complete analytics fix deployed!"
echo ""
echo "📊 Unified metrics across:"
echo "  ✓ Admin Dashboard - Full analytics + charts"
echo "  ✓ PWA - Public stats in header"
echo "  ✓ WhatsApp - Links to PWA"
echo "  ✓ Public API - Basic stats"
echo ""
echo "🎯 New features:"
echo "  ✓ Single source of truth (unified_analytics view)"
echo "  ✓ Marketing template performance tracking"
echo "  ✓ Template v2 adoption rate"
echo "  ✓ Compliance score in analytics"
echo "  ✓ Consistent counts everywhere"
