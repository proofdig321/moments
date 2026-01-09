-- Full Comments System Schema

-- Moment comments with threading support
CREATE TABLE IF NOT EXISTS moment_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES moment_comments(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id),
  phone_number TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  approved BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE, -- For broadcast inclusion
  moderated_by TEXT,
  moderated_at TIMESTAMPTZ,
  mcp_analysis JSONB,
  hashtags TEXT[], -- For auto-linking (#moment123)
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment linking patterns for auto-detection
CREATE TABLE IF NOT EXISTS comment_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moment_id UUID REFERENCES moments(id),
  pattern_type TEXT NOT NULL, -- hashtag, keyword, timing
  pattern_value TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moment_comments_moment_id ON moment_comments(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_comments_parent ON moment_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_moment_comments_approved ON moment_comments(approved);
CREATE INDEX IF NOT EXISTS idx_moment_comments_featured ON moment_comments(featured);
CREATE INDEX IF NOT EXISTS idx_comment_patterns_moment ON comment_patterns(moment_id);

-- RLS policies
ALTER TABLE moment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_patterns ENABLE ROW LEVEL SECURITY;

-- Function to update reply counts
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE moment_comments 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE moment_comments 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.parent_comment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply count updates
DROP TRIGGER IF EXISTS trigger_update_reply_count ON moment_comments;
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON moment_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- Function to auto-link messages to moments
CREATE OR REPLACE FUNCTION auto_link_message_to_moment(
  message_content TEXT,
  message_phone TEXT,
  message_id UUID
) RETURNS UUID AS $$
DECLARE
  moment_uuid UUID;
  pattern_record RECORD;
BEGIN
  -- Check for hashtag patterns (#moment123, #M123)
  FOR pattern_record IN 
    SELECT moment_id FROM comment_patterns 
    WHERE pattern_type = 'hashtag' 
    AND active = TRUE 
    AND message_content ILIKE '%' || pattern_value || '%'
  LOOP
    RETURN pattern_record.moment_id;
  END LOOP;
  
  -- Check for keyword patterns
  FOR pattern_record IN 
    SELECT moment_id FROM comment_patterns 
    WHERE pattern_type = 'keyword' 
    AND active = TRUE 
    AND message_content ILIKE '%' || pattern_value || '%'
  LOOP
    RETURN pattern_record.moment_id;
  END LOOP;
  
  -- Check for recent moment timing (last 24 hours)
  SELECT m.id INTO moment_uuid
  FROM moments m
  WHERE m.broadcasted_at > NOW() - INTERVAL '24 hours'
  ORDER BY m.broadcasted_at DESC
  LIMIT 1;
  
  RETURN moment_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to create comment from message
CREATE OR REPLACE FUNCTION create_comment_from_message(
  p_message_id UUID,
  p_moment_id UUID DEFAULT NULL,
  p_parent_comment_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  message_record RECORD;
  comment_id UUID;
  detected_moment_id UUID;
BEGIN
  -- Get message details
  SELECT * INTO message_record FROM messages WHERE id = p_message_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Auto-detect moment if not provided
  IF p_moment_id IS NULL THEN
    detected_moment_id := auto_link_message_to_moment(
      message_record.content, 
      message_record.from_number, 
      p_message_id
    );
  ELSE
    detected_moment_id := p_moment_id;
  END IF;
  
  -- Create comment if moment found
  IF detected_moment_id IS NOT NULL THEN
    INSERT INTO moment_comments (
      moment_id,
      parent_comment_id,
      message_id,
      phone_number,
      content,
      media_urls,
      hashtags
    ) VALUES (
      detected_moment_id,
      p_parent_comment_id,
      p_message_id,
      message_record.from_number,
      message_record.content,
      CASE WHEN message_record.media_url IS NOT NULL 
           THEN ARRAY[message_record.media_url] 
           ELSE '{}' END,
      regexp_split_to_array(
        regexp_replace(message_record.content, '.*?(#\w+).*', '\1', 'g'), 
        '\s+'
      )
    ) RETURNING id INTO comment_id;
    
    RETURN comment_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Sample comment patterns for testing
INSERT INTO comment_patterns (moment_id, pattern_type, pattern_value) 
SELECT 
  m.id,
  'hashtag',
  '#M' || substr(m.id::text, 1, 8)
FROM moments m
WHERE NOT EXISTS (
  SELECT 1 FROM comment_patterns cp 
  WHERE cp.moment_id = m.id AND cp.pattern_type = 'hashtag'
)
LIMIT 5;