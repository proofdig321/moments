# Unified Analytics System

## Problem
Analytics were inconsistent across interfaces:
- **Admin Dashboard**: Called `/analytics/dashboard`, showed daily_stats
- **PWA**: Called `/analytics`, expected different format
- **Public API**: Used separate queries with different counts
- **WhatsApp**: No direct analytics, only links to PWA

## Solution: Single Source of Truth

### unified_analytics View
```sql
CREATE VIEW unified_analytics AS
SELECT 
  total_moments,           -- Broadcasted moments
  active_subscribers,      -- Opted-in users
  total_broadcasts,        -- Delivered/sent broadcasts
  broadcasts_today,        -- Today's broadcasts
  delivery_rate_7d,        -- 7-day delivery success %
  sponsored_moments,       -- Sponsored content count
  template_v2_adoption,    -- Marketing template adoption %
  avg_compliance_score,    -- Average compliance score
  last_updated            -- Timestamp
FROM ...
```

## Consistent Metrics

| Metric | Definition | Used By |
|--------|-----------|---------|
| **total_moments** | COUNT(moments WHERE status='broadcasted') | All |
| **active_subscribers** | COUNT(subscriptions WHERE opted_in=true) | All |
| **total_broadcasts** | COUNT(broadcasts WHERE status IN ('delivered','sent')) | All |
| **broadcasts_today** | COUNT(broadcasts WHERE created_at >= CURRENT_DATE) | Admin |
| **delivery_rate_7d** | % delivered in last 7 days | Admin |
| **template_v2_adoption** | % using v2 templates (last 7 days) | Admin |
| **avg_compliance_score** | Average compliance score (last 7 days) | Admin |

## API Endpoints

### 1. PWA Endpoint
**GET** `/admin-api/analytics`
```json
{
  "totalMoments": 0,
  "activeSubscribers": 0,
  "totalBroadcasts": 0,
  "broadcastsToday": 0,
  "deliveryRate": 0,
  "templateAdoption": 0,
  "lastUpdated": "2024-01-12T10:30:00Z"
}
```

### 2. Admin Dashboard Endpoint
**GET** `/admin-api/analytics/dashboard`
```json
{
  "daily": [...],
  "regional": [...],
  "category": [...],
  "templates": [...],
  "adoption": {...}
}
```

### 3. Public API Endpoint
**GET** `/api/stats`
```json
{
  "totalMoments": 0,
  "activeSubscribers": 0,
  "totalBroadcasts": 0,
  "lastUpdated": "2024-01-12T10:30:00Z"
}
```

## Interface Consistency

### Admin Dashboard
- Shows: Total Moments, Active Subscribers, Total Broadcasts, Template v2 Adoption
- Source: `unified_analytics` view via `/analytics/dashboard`
- Updates: Real-time via refresh button

### PWA (moments.unamifoundation.org)
- Shows: Stories Shared, Community Members, Updates Sent
- Source: `unified_analytics` view via `/analytics`
- Updates: Every 30 seconds

### WhatsApp
- Shows: Links to PWA for full stats
- Commands: START, STOP, HELP (no direct analytics)
- Broadcasts: Include PWA link in footer

### Public API
- Shows: Basic stats (no sensitive data)
- Source: `unified_analytics` view
- Updates: On-demand

## Data Flow

```
Database Tables
  ↓
unified_analytics VIEW (single source of truth)
  ↓
├─→ /admin-api/analytics (PWA)
├─→ /admin-api/analytics/dashboard (Admin)
└─→ /api/stats (Public)
```

## Deployment

```bash
./deploy-unified-analytics.sh
```

## Verification

```sql
-- Check unified analytics
SELECT * FROM unified_analytics;

-- Verify consistency
SELECT 
  (SELECT total_moments FROM unified_analytics) as view_moments,
  (SELECT COUNT(*) FROM moments WHERE status='broadcasted') as direct_moments,
  (SELECT total_moments FROM unified_analytics) = 
  (SELECT COUNT(*) FROM moments WHERE status='broadcasted') as consistent;
```

## Benefits

1. **Single Source of Truth** - All interfaces use same view
2. **Consistent Counts** - No discrepancies between admin/PWA
3. **Performance** - View is cached, no repeated queries
4. **Maintainability** - Update logic in one place
5. **Real-time** - View always reflects current state
