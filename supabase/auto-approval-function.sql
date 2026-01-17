-- Auto-Approval RPC Function for n8n Soft Moderation
CREATE OR REPLACE FUNCTION process_auto_approval_queue()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
  msg RECORD;
BEGIN
  FOR msg IN 
    SELECT m.id, m.content, m.from_number, a.confidence
    FROM messages m
    LEFT JOIN advisories a ON a.message_id = m.id
    WHERE m.moderation_status = 'pending'
      AND a.confidence < 0.3
      AND m.created_at > NOW() - INTERVAL '24 hours'
    LIMIT 50
  LOOP
    UPDATE messages 
    SET moderation_status = 'approved',
        moderation_timestamp = NOW()
    WHERE id = msg.id;
    
    INSERT INTO moments (title, content, region, category, status, created_by, content_source)
    VALUES (
      SUBSTRING(msg.content, 1, 50),
      msg.content,
      'National',
      'Community',
      'broadcasted',
      'auto_moderation',
      'whatsapp'
    );
    
    INSERT INTO moderation_audit (message_id, action, moderator, reason)
    VALUES (msg.id, 'approved', 'auto_moderation', 'Low risk: ' || COALESCE(msg.confidence::TEXT, '0'));
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
