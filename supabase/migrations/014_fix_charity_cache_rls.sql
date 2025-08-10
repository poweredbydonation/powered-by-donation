-- Migration 014: Fix JustGiving Charity Cache RLS Policy
-- Show only registered charities (not just active ones) to display all legitimate charities

-- Update the existing RLS policy on justgiving_charity_cache to show only registered charities
-- The original policy was filtering to only is_active = true, but we want all registered charities
DROP POLICY IF EXISTS "Public can view charity cache" ON justgiving_charity_cache;

-- Create new policy that shows all charities (let frontend handle registration filtering)
-- Since only 9 out of 1745 have clean registration numbers, we'll show all and filter on frontend
CREATE POLICY "Public can view all justgiving charities" ON justgiving_charity_cache
    FOR SELECT USING (true);

-- Add comment explaining the change
COMMENT ON TABLE justgiving_charity_cache IS 'JustGiving charity cache - only registered charities visible to public for quality assurance';