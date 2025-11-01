-- Test query to check if the is_meaningful_description function is working correctly
-- Run this to see which JustGiving organizations would be hidden

SELECT 
  name,
  description,
  LENGTH(TRIM(description)) as desc_length,
  is_meaningful_description(description) as is_meaningful,
  show_on_platform
FROM organization_cache 
WHERE platform = 'justgiving' 
AND (
  description = '.' OR 
  description = '..' OR 
  description = '...' OR
  TRIM(LOWER(description)) IN ('n/a', 'na', 'none', 'nil') OR
  LENGTH(TRIM(description)) < 10
)
ORDER BY is_meaningful_description(description), LENGTH(description)
LIMIT 20;

-- Count how many would be affected
SELECT 
  COUNT(*) as total_justgiving,
  COUNT(*) FILTER (WHERE NOT is_meaningful_description(description)) as would_be_hidden,
  COUNT(*) FILTER (WHERE is_meaningful_description(description)) as would_remain_visible
FROM organization_cache 
WHERE platform = 'justgiving';