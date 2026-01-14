-- UNIFIED ANALYTICS SYSTEM
-- Consistent metrics across Admin, PWA, and WhatsApp

-- 1. Create unified analytics view
CREATE OR REPLACE VIEW unified_analytics AS
SELECT 
  (SELECT COUNT(*) FROM moments WHERE status = 'broadcasted') as total_moments,
  (SELECT COUNT(*) FROM subscriptions WHERE opted_in = true) as active_subscribers,
  (SELECT COUNT(*) FROM broadcasts WHERE status IN ('delivered', 'sent')) as total_broadcasts,
  (SELECT COUNT(*) FROM broadcasts WHERE created_at >= CURRENT_DATE) as broadcasts_today,
  (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*), 0), 1) 
   FROM broadcasts WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as delivery_rate_7d,
  (SELECT COUNT(*) FROM moments WHERE sponsor_id IS NOT NULL AND status = 'broadcasted') as sponsored_moments,
  (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE template_name LIKE '%_v2') / NULLIF(COUNT(*), 0), 1)
   FROM broadcasts WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as template_v2_adoption,
  (SELECT AVG(compliance_score) FROM marketing_compliance WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as avg_compliance_score,
  CURRENT_TIMESTAMP as last_updated;

-- 2. Grant access
GRANT SELECT ON unified_analytics TO anon, authenticated;

-- 3. Update refresh_analytics to use consistent data
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  -- Get unified stats
  INSERT INTO daily_stats (
    stat_date, 
    total_moments, 
    total_comments, 
    total_subscribers, 
    active_subscribers, 
    total_broadcasts,
    broadcast_success_rate
  )
  SELECT 
    CURRENT_DATE,
    total_moments,
    0, -- comments deprecated
    (SELECT COUNT(*) FROM subscriptions),
    active_subscribers,
    total_broadcasts,
    COALESCE(delivery_rate_7d, 0)
  FROM unified_analytics
  ON CONFLICT (stat_date) DO UPDATE SET
    total_moments = EXCLUDED.total_moments,
    total_subscribers = EXCLUDED.total_subscribers,
    active_subscribers = EXCLUDED.active_subscribers,
    total_broadcasts = EXCLUDED.total_broadcasts,
    broadcast_success_rate = EXCLUDED.broadcast_success_rate;

  -- Regional stats
  DELETE FROM regional_stats;
  INSERT INTO regional_stats (region, moment_count, comment_count, subscriber_count)
  SELECT 
    COALESCE(m.region, 'Unknown'),
    COUNT(DISTINCT m.id),
    0,
    0
  FROM moments m
  WHERE m.status = 'broadcasted'
  GROUP BY m.region;

  -- Category stats
  DELETE FROM category_stats;
  INSERT INTO category_stats (category, moment_count, comment_count, avg_engagement)
  SELECT 
    COALESCE(m.category, 'General'),
    COUNT(DISTINCT m.id),
    0,
    0
  FROM moments m
  WHERE m.status = 'broadcasted'
  GROUP BY m.category;
END;
$$ LANGUAGE plpgsql;

-- 4. Initialize
SELECT refresh_analytics();
