-- Automated Campaign Pipeline System
-- Handles campaign approval, moment creation, and distribution

-- Function to auto-publish approved campaigns
CREATE OR REPLACE FUNCTION auto_publish_campaign(campaign_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaign_record RECORD;
  moment_id UUID;
  primary_region TEXT;
  primary_category TEXT;
BEGIN
  -- Get campaign details
  SELECT * INTO campaign_record FROM campaigns WHERE id = campaign_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', campaign_id;
  END IF;
  
  -- Check if campaign is approved
  IF campaign_record.status != 'approved' THEN
    RAISE EXCEPTION 'Campaign must be approved before publishing';
  END IF;
  
  -- Determine primary region and category
  primary_region := CASE
    WHEN array_length(campaign_record.target_regions, 1) > 0 THEN campaign_record.target_regions[1]
    ELSE 'National'
  END;
  
  primary_category := CASE
    WHEN array_length(campaign_record.target_categories, 1) > 0 THEN campaign_record.target_categories[1]
    ELSE 'Sponsored'
  END;
  
  -- Create moment from campaign
  INSERT INTO moments (
    title,
    content,
    region,
    category,
    language,
    sponsor_id,
    is_sponsored,
    media_urls,
    content_source,
    status,
    broadcasted_at,
    publish_to_pwa,
    publish_to_whatsapp,
    created_by
  ) VALUES (
    campaign_record.title,
    campaign_record.content,
    primary_region,
    primary_category,
    'eng',
    campaign_record.sponsor_id,
    true,
    campaign_record.media_urls,
    'campaign',
    'broadcasted',
    NOW(),
    true,  -- Auto-publish to PWA
    true,  -- Auto-publish to WhatsApp (campaigns are pre-approved)
    'campaign_automation'
  ) RETURNING id INTO moment_id;
  
  -- Update campaign status
  UPDATE campaigns 
  SET status = 'published', updated_at = NOW()
  WHERE id = campaign_id;
  
  -- Log the publication
  INSERT INTO flags (
    message_id,
    flag_type,
    severity,
    action_taken,
    notes
  ) VALUES (
    NULL, -- No message_id for campaigns
    'campaign_published',
    'low',
    'auto_published',
    'Campaign automatically published as moment: ' || moment_id
  );
  
  RETURN moment_id;
END;
$$;

-- Function to process scheduled campaigns
CREATE OR REPLACE FUNCTION process_scheduled_campaigns()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaign_record RECORD;
  processed_count INTEGER := 0;
  moment_id UUID;
BEGIN
  -- Process campaigns scheduled for now or earlier
  FOR campaign_record IN
    SELECT *
    FROM campaigns
    WHERE status = 'approved'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= NOW()
    ORDER BY scheduled_at ASC
    LIMIT 10
  LOOP
    BEGIN
      -- Auto-publish the campaign
      SELECT auto_publish_campaign(campaign_record.id) INTO moment_id;
      processed_count := processed_count + 1;
      
      -- Log success
      RAISE NOTICE 'Published scheduled campaign % as moment %', campaign_record.id, moment_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log failure but continue processing
      RAISE NOTICE 'Failed to publish campaign %: %', campaign_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN processed_count;
END;
$$;

-- Function to auto-approve low-risk campaigns
CREATE OR REPLACE FUNCTION auto_approve_campaign(campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaign_record RECORD;
  risk_score INTEGER := 0;
  auto_approved BOOLEAN := false;
BEGIN
  -- Get campaign details
  SELECT * INTO campaign_record FROM campaigns WHERE id = campaign_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Only auto-approve pending campaigns
  IF campaign_record.status != 'pending_review' THEN
    RETURN false;
  END IF;
  
  -- Calculate risk score
  -- High risk indicators
  IF campaign_record.content ~* '\b(money|cash|prize|win|free|click|urgent|limited time)\b' THEN
    risk_score := risk_score + 3;
  END IF;
  
  -- Medium risk indicators  
  IF LENGTH(campaign_record.content) > 1000 THEN
    risk_score := risk_score + 2;
  END IF;
  
  IF campaign_record.budget > 10000 THEN
    risk_score := risk_score + 2;
  END IF;
  
  -- Low risk indicators (reduce score)
  IF campaign_record.content ~* '\b(community|education|health|safety|culture)\b' THEN
    risk_score := risk_score - 1;
  END IF;
  
  IF campaign_record.sponsor_id IS NOT NULL THEN
    risk_score := risk_score - 1;
  END IF;
  
  -- Auto-approve if low risk (score <= 1)
  IF risk_score <= 1 THEN
    UPDATE campaigns 
    SET status = 'approved', updated_at = NOW()
    WHERE id = campaign_id;
    
    auto_approved := true;
    
    -- Log auto-approval
    INSERT INTO flags (
      message_id,
      flag_type,
      severity,
      action_taken,
      notes
    ) VALUES (
      NULL,
      'campaign_auto_approved',
      'low',
      'auto_approved',
      'Campaign auto-approved with risk score: ' || risk_score
    );
  END IF;
  
  RETURN auto_approved;
END;
$$;

-- Trigger for campaign automation
CREATE OR REPLACE FUNCTION trigger_campaign_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle new campaigns
  IF TG_OP = 'INSERT' THEN
    -- Try auto-approval for new campaigns
    PERFORM auto_approve_campaign(NEW.id);
    RETURN NEW;
  END IF;
  
  -- Handle status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- If campaign was just approved and has no schedule, publish immediately
    IF NEW.status = 'approved' AND NEW.scheduled_at IS NULL THEN
      -- Delay execution to avoid transaction conflicts
      PERFORM pg_notify('auto_publish_campaign', NEW.id::text);
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS campaigns_automation ON campaigns;
CREATE TRIGGER campaigns_automation
  AFTER INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_campaign_automation();

-- Function to get campaign pipeline stats
CREATE OR REPLACE FUNCTION get_campaign_stats(timeframe_days INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  start_date TIMESTAMPTZ;
BEGIN
  start_date := NOW() - (timeframe_days || ' days')::INTERVAL;
  
  SELECT json_build_object(
    'total_campaigns', COUNT(*),
    'pending_review', COUNT(*) FILTER (WHERE status = 'pending_review'),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'published', COUNT(*) FILTER (WHERE status = 'published'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'auto_approved', COUNT(*) FILTER (WHERE created_by = 'campaign_automation'),
    'scheduled', COUNT(*) FILTER (WHERE scheduled_at IS NOT NULL AND scheduled_at > NOW()),
    'avg_budget', ROUND(AVG(budget)::NUMERIC, 2)
  )
  INTO result
  FROM campaigns
  WHERE created_at >= start_date;
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_publish_campaign TO service_role;
GRANT EXECUTE ON FUNCTION process_scheduled_campaigns TO service_role;
GRANT EXECUTE ON FUNCTION auto_approve_campaign TO service_role;
GRANT EXECUTE ON FUNCTION get_campaign_stats TO service_role;

-- Create indexes for efficient campaign processing
CREATE INDEX IF NOT EXISTS idx_campaigns_automation 
ON campaigns (status, scheduled_at) 
WHERE status IN ('pending_review', 'approved');

CREATE INDEX IF NOT EXISTS idx_campaigns_auto_publish 
ON campaigns (status, scheduled_at) 
WHERE status = 'approved' AND scheduled_at IS NOT NULL;