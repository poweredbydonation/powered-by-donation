-- ============================================
-- TERMS TIMESTAMP MIGRATION SQL
-- Execute this in Supabase Dashboard SQL Editor
-- ============================================

-- Add the three timestamp columns for terms acceptance
ALTER TABLE users ADD COLUMN fundraiser_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN donor_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;  
ALTER TABLE users ADD COLUMN donor_organization_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for better performance (optional but recommended)
CREATE INDEX idx_users_fundraiser_terms 
  ON users(fundraiser_service_terms_accepted_time) 
  WHERE fundraiser_service_terms_accepted_time IS NOT NULL;
  
CREATE INDEX idx_users_donor_service_terms 
  ON users(donor_service_terms_accepted_time) 
  WHERE donor_service_terms_accepted_time IS NOT NULL;
  
CREATE INDEX idx_users_donor_org_terms 
  ON users(donor_organization_terms_accepted_time) 
  WHERE donor_organization_terms_accepted_time IS NOT NULL;

-- Optional: Add comments to document the columns
COMMENT ON COLUMN users.fundraiser_service_terms_accepted_time 
  IS 'Timestamp when user accepted terms to offer services for donations';
  
COMMENT ON COLUMN users.donor_service_terms_accepted_time 
  IS 'Timestamp when user accepted terms to request services from fundraisers';
  
COMMENT ON COLUMN users.donor_organization_terms_accepted_time 
  IS 'Timestamp when user accepted terms to make direct donations to organizations';

-- Verification query - run this after the above to confirm
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public' 
  AND column_name LIKE '%terms_accepted_time'
ORDER BY column_name;