-- SYSTEM OPTIMIZATION
-- Performance indexes, query optimization, caching

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_moments_broadcasted_at ON moments(broadcasted_at DESC) WHERE status = 'broadcasted';
CREATE INDEX IF NOT EXISTS idx_comments_moment_approved ON comments(moment_id, created_at DESC) WHERE moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_broadcasts_moment_status ON broadcasts(moment_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_opted_in_regions ON subscriptions(opted_in, regions) WHERE opted_in = true;
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_comments_moment ON whatsapp_comments(moment_id, created_at DESC);

-- Materialized view for top moments
CREATE MATERIALIZED VIEW IF NOT EXISTS top_moments AS
SELECT 
  m.id,
  m.title,
  m.region,
  m.category,
  m.broadcasted_at,
  COUNT(DISTINCT c.id) as comment_count,
  COALESCE(ms.view_count, 0) as view_count
FROM moments m
LEFT JOIN comments c ON c.moment_id = m.id AND c.moderation_status = 'approved'
LEFT JOIN moment_stats ms ON ms.moment_id = m.id
WHERE m.status = 'broadcasted'
GROUP BY m.id, m.title, m.region, m.category, m.broadcasted_at, ms.view_count
ORDER BY comment_count DESC, view_count DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_top_moments_id ON top_moments(id);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_top_moments()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY top_moments;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old data function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
  DELETE FROM notification_queue WHERE status = 'sent' AND created_at < NOW() - INTERVAL '7 days';
  DELETE FROM error_logs WHERE resolved = true AND created_at < NOW() - INTERVAL '30 days';
  DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '7 days';
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
