# Analytics Consistency - Quick Reference

## The Problem
❌ Admin showed "Failed to load analytics"  
❌ PWA called different endpoint than Admin  
❌ Public API used separate queries  
❌ Counts didn't match across interfaces  

## The Solution
✅ **unified_analytics** view = single source of truth  
✅ All interfaces query same view  
✅ Consistent metrics everywhere  
✅ Added marketing template analytics  

## Metrics (Consistent Across All)

| Metric | Value |
|--------|-------|
| **total_moments** | Broadcasted moments |
| **active_subscribers** | Opted-in users |
| **total_broadcasts** | Delivered/sent broadcasts |
| **template_v2_adoption** | % using marketing templates |

## Endpoints

```bash
# PWA (public stats in header)
GET /admin-api/analytics
→ {totalMoments, activeSubscribers, totalBroadcasts, templateAdoption}

# Admin Dashboard (full analytics)
GET /admin-api/analytics/dashboard
→ {daily, regional, category, templates, adoption}

# Public API (basic stats)
GET /api/stats
→ {totalMoments, activeSubscribers, totalBroadcasts}
```

## Deploy

```bash
./deploy-complete-analytics.sh
```

## Verify

```sql
-- Check unified view
SELECT * FROM unified_analytics;

-- Verify consistency
SELECT 
  (SELECT total_moments FROM unified_analytics),
  (SELECT COUNT(*) FROM moments WHERE status='broadcasted');
-- Should match!
```

## Files Changed

- `supabase/complete_analytics_fix.sql` - Unified view + template analytics
- `supabase/functions/admin-api/index.ts` - Added /analytics endpoint
- `public/moments/index.html` - Uses /analytics endpoint
- `public/admin-dashboard.html` - Shows template adoption
- `src/public.js` - Uses unified_analytics view

## What's Tracked

**Admin Dashboard:**
- Total Moments, Active Subscribers, Total Broadcasts, Template v2 Adoption
- Daily trends chart (moments + broadcasts)
- Regional distribution
- Category breakdown
- Template performance table

**PWA Header:**
- Stories Shared (total_moments)
- Community Members (active_subscribers)
- Updates Sent (total_broadcasts)

**WhatsApp:**
- Links to PWA for stats
- No direct analytics display

## Benefits

1. **No More Discrepancies** - Same numbers everywhere
2. **Single Update Point** - Change view, updates all interfaces
3. **Performance** - View cached, no repeated queries
4. **Marketing Insights** - Template adoption + compliance tracking
5. **Real-time** - View always current
