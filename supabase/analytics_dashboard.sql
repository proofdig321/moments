-- ANALYTICS DASHBOARD
-- Real-time engagement metrics and reporting

-- Daily aggregated stats
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_moments INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  total_broadcasts INTEGER DEFAULT 0,
  broadcast_success_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date DESC);

-- Regional performance
CREATE TABLE IF NOT EXISTS regional_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  moment_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regional_stats_region ON regional_stats(region);

-- Category performance
CREATE TABLE IF NOT EXISTS category_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  moment_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_stats_category ON category_stats(category);

-- RLS
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON daily_stats;
DROP POLICY IF EXISTS "Public read" ON regional_stats;
DROP POLICY IF EXISTS "Public read" ON category_stats;

CREATE POLICY "Public read" ON daily_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON regional_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON category_stats FOR SELECT USING (true);

-- Refresh stats function
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  -- Daily stats
  INSERT INTO daily_stats (stat_date, total_moments, total_comments, total_subscribers, active_subscribers, total_broadcasts)
  SELECT 
    CURRENT_DATE,
    (SELECT COUNT(*) FROM moments),
    (SELECT COUNT(*) FROM comments WHERE moderation_status = 'approved'),
    (SELECT COUNT(*) FROM subscriptions),
    (SELECT COUNT(*) FROM subscriptions WHERE opted_in = true),
    (SELECT COUNT(*) FROM broadcasts)
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
    m.region,
    COUNT(DISTINCT m.id),
    COUNT(DISTINCT c.id),
    0
  FROM moments m
  LEFT JOIN comments c ON c.moment_id = m.id
  WHERE m.status = 'broadcasted'
  GROUP BY m.region;

  -- Category stats
  DELETE FROM category_stats;
  INSERT INTO category_stats (category, moment_count, comment_count, avg_engagement)
  SELECT 
    m.category,
    COUNT(DISTINCT m.id),
    COUNT(DISTINCT c.id),
    CASE WHEN COUNT(DISTINCT m.id) > 0 THEN COUNT(DISTINCT c.id)::DECIMAL / COUNT(DISTINCT m.id) ELSE 0 END
  FROM moments m
  LEFT JOIN comments c ON c.moment_id = m.id
  WHERE m.status = 'broadcasted'
  GROUP BY m.category;
END;
$$ LANGUAGE plpgsql;
