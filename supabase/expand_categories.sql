-- Expand moment categories for Meta marketing templates
-- Drop old constraint
ALTER TABLE moments DROP CONSTRAINT IF EXISTS moments_category_check;

-- Add new constraint with marketing-friendly categories
ALTER TABLE moments ADD CONSTRAINT moments_category_check 
CHECK (category IN (
  -- Original categories
  'Education', 'Safety', 'Culture', 'Opportunity', 'Events', 'Health', 'Technology', 'Community',
  -- Marketing template categories
  'Community Education', 'Safety Awareness', 'Cultural Events', 'Job Opportunities', 
  'Local Services', 'Environmental Initiatives', 'Youth Programs', 'Government Services',
  'Financial Literacy', 'Healthcare Services', 'Religious Events',
  -- Additional marketing categories
  'Business', 'Entertainment', 'Sports', 'News', 'Lifestyle', 'Food', 'Travel',
  'Real Estate', 'Automotive', 'Fashion', 'Arts', 'Music', 'General'
));
