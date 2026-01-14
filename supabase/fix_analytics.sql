-- FIX ANALYTICS + ADD MARKETING TEMPLATE ANALYTICS
-- Fixes empty analytics tables and adds template performance tracking

-- 1. Fix refresh_analytics to handle missing tables
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  -- Daily stats
  INSERT INTO daily_stats (stat_date, total_moments, total_comments, total_subscribers, active_subscribers, total_broadcasts)
  SELECT 
    CURRENT_DATE,
    COALESCE((SELECT COUNT(*) FROM moments), 0),
    COALESCE((SELECT COUNT(*) FROM messages WHERE message_type = 'text'), 0),
    COALESCE((SELECT COUNT(*) FROM subscriptions), 0),
    COALESCE((SELECT COUNT(*) FROM subscriptions WHERE opted_in = true), 0),
    COALESCE((SELECT COUNT(*) FROM broadcasts), 0)
  ON CONFLICT (stat_date) DO UPDATE SET
    total_moments = EXCLUDED.total_moments,
    total_comments = EXCLUDED.total_comments,
    total_subscribers = EXCLUDED.total_subscribers,
    active_subscribers = EXCLUDED.active_subscribers,
    total_broadcasts = EXCLUDED.total_broadcasts;

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

-- 2. Add marketing template analytics view
CREATE OR REPLACE VIEW template_analytics AS
SELECT 
  DATE(b.created_at) as broadcast_date,
  b.template_name,
  b.template_category,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE b.status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE b.status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE b.status = 'delivered') / NULLIF(COUNT(*), 0), 1) as delivery_rate,
  COUNT(DISTINCT b.moment_id) as unique_moments,
  COUNT(*) FILTER (WHERE m.sponsor_id IS NOT NULL) as sponsored_count,
  AVG(mc.compliance_score) as avg_compliance_score
FROM broadcasts b
LEFT JOIN moments m ON b.moment_id = m.id
LEFT JOIN marketing_compliance mc ON b.id = mc.broadcast_id
WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(b.created_at), b.template_name, b.template_category
ORDER BY broadcast_date DESC, total_sent DESC;

-- 3. Add template adoption metrics view
CREATE OR REPLACE VIEW template_adoption AS
SELECT 
  COUNT(*) FILTER (WHERE template_name LIKE '%_v2') as v2_templates,
  COUNT(*) FILTER (WHERE template_name NOT LIKE '%_v2') as v1_templates,
  ROUND(100.0 * COUNT(*) FILTER (WHERE template_name LIKE '%_v2') / NULLIF(COUNT(*), 0), 1) as adoption_rate,
  COUNT(*) FILTER (WHERE template_category = 'MARKETING') as marketing_templates,
  COUNT(*) FILTER (WHERE template_category != 'MARKETING' OR template_category IS NULL) as utility_templates
FROM broadcasts
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- 4. Initialize analytics with current data
SELECT refresh_analytics();

-- 5. Grant access
GRANT SELECT ON template_analytics TO anon, authenticated;
GRANT SELECT ON template_adoption TO anon, authenticated;
