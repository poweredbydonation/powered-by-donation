-- Add Terms & Conditions timestamp columns and remove boolean role columns
-- Migration: 20250827000001_add_terms_timestamps.sql

BEGIN;

-- Remove old boolean role columns if they exist
ALTER TABLE users DROP COLUMN IF EXISTS is_donor;
ALTER TABLE users DROP COLUMN IF EXISTS is_fundraiser;

-- Add timestamp columns for terms acceptance
ALTER TABLE users ADD COLUMN fundraiser_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN donor_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN donor_organization_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX idx_users_fundraiser_terms ON users(fundraiser_service_terms_accepted_time) WHERE fundraiser_service_terms_accepted_time IS NOT NULL;
CREATE INDEX idx_users_donor_service_terms ON users(donor_service_terms_accepted_time) WHERE donor_service_terms_accepted_time IS NOT NULL;
CREATE INDEX idx_users_donor_org_terms ON users(donor_organization_terms_accepted_time) WHERE donor_organization_terms_accepted_time IS NOT NULL;

-- Create view for backward compatibility with existing code
CREATE OR REPLACE VIEW users_with_roles AS 
SELECT *,
  (fundraiser_service_terms_accepted_time IS NOT NULL) as is_fundraiser,
  (donor_service_terms_accepted_time IS NOT NULL OR donor_organization_terms_accepted_time IS NOT NULL) as is_donor
FROM users;

COMMIT;