-- Fix multiple permissive policies on justgiving_charity_cache table
-- Consolidate "Public can view all justgiving charities" and "Authenticated can manage charity cache" 
-- into optimized policies that don't overlap

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view all justgiving charities" ON justgiving_charity_cache;
DROP POLICY IF EXISTS "Authenticated can manage charity cache" ON justgiving_charity_cache;

-- Create consolidated policy for SELECT access (public can read)
CREATE POLICY "Public can view charity cache" ON justgiving_charity_cache
    FOR SELECT TO public
    USING (true);

-- Create separate policies for authenticated users for non-SELECT operations
CREATE POLICY "Authenticated can insert charity cache" ON justgiving_charity_cache
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated can update charity cache" ON justgiving_charity_cache
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated can delete charity cache" ON justgiving_charity_cache
    FOR DELETE TO authenticated
    USING (true);

-- Add comment explaining the policy structure
COMMENT ON TABLE justgiving_charity_cache IS 'JustGiving charity cache with optimized RLS policies: public read access, authenticated write access';