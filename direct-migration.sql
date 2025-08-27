-- Direct SQL migration for terms timestamp columns
-- Execute this manually in Supabase SQL Editor

BEGIN;

-- Remove old boolean role columns
ALTER TABLE users DROP COLUMN IF EXISTS is_donor;
ALTER TABLE users DROP COLUMN IF EXISTS is_fundraiser;

-- Add timestamp columns for terms acceptance
ALTER TABLE users ADD COLUMN fundraiser_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN donor_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;  
ALTER TABLE users ADD COLUMN donor_organization_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX idx_users_fundraiser_terms 
  ON users(fundraiser_service_terms_accepted_time) 
  WHERE fundraiser_service_terms_accepted_time IS NOT NULL;
  
CREATE INDEX idx_users_donor_service_terms 
  ON users(donor_service_terms_accepted_time) 
  WHERE donor_service_terms_accepted_time IS NOT NULL;
  
CREATE INDEX idx_users_donor_org_terms 
  ON users(donor_organization_terms_accepted_time) 
  WHERE donor_organization_terms_accepted_time IS NOT NULL;

COMMIT;