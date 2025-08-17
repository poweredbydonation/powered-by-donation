-- Complete ACNC Platform Integration
-- Consolidates migrations 030-035 into single comprehensive migration
-- Adds ACNC as third platform alongside JustGiving and Every.org

-- Add 'acnc' to the donation_platform enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'donation_platform') THEN
        RAISE EXCEPTION 'donation_platform enum does not exist';
    END IF;
    
    -- Check if 'acnc' value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'donation_platform' AND e.enumlabel = 'acnc'
    ) THEN
        ALTER TYPE donation_platform ADD VALUE 'acnc';
    END IF;
END $$;

-- Add ACNC-specific fields to organization_cache table
ALTER TABLE organization_cache 
ADD COLUMN IF NOT EXISTS acnc_abn text,
ADD COLUMN IF NOT EXISTS acnc_charity_legal_name text,
ADD COLUMN IF NOT EXISTS acnc_other_organisation_names text,
ADD COLUMN IF NOT EXISTS acnc_address_type text,
ADD COLUMN IF NOT EXISTS acnc_registration_date text,
ADD COLUMN IF NOT EXISTS acnc_date_organisation_established text,
ADD COLUMN IF NOT EXISTS acnc_charity_size text,
ADD COLUMN IF NOT EXISTS acnc_number_of_responsible_persons text,
ADD COLUMN IF NOT EXISTS acnc_financial_year_end text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_act text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_nsw text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_nt text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_qld text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_sa text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_tas text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_vic text,
ADD COLUMN IF NOT EXISTS acnc_operates_in_wa text,
ADD COLUMN IF NOT EXISTS acnc_operating_countries text,
ADD COLUMN IF NOT EXISTS acnc_pbi text,
ADD COLUMN IF NOT EXISTS acnc_hpc text,
ADD COLUMN IF NOT EXISTS acnc_purposes jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS acnc_beneficiaries jsonb DEFAULT '{}'::jsonb;

-- Create indexes for ACNC-specific queries
CREATE INDEX IF NOT EXISTS idx_organization_cache_acnc_abn ON organization_cache (acnc_abn);
CREATE INDEX IF NOT EXISTS idx_organization_cache_acnc_size ON organization_cache (acnc_charity_size);
CREATE INDEX IF NOT EXISTS idx_organization_cache_acnc_state ON organization_cache (acnc_operates_in_nsw, acnc_operates_in_vic, acnc_operates_in_qld);

-- Update the FTS function to include ACNC fields
CREATE OR REPLACE FUNCTION update_organization_cache_fts()
RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.display_name, '') || ' ' ||
    COALESCE(NEW.keywords, '') || ' ' ||
    COALESCE(NEW.address_city, '') || ' ' ||
    COALESCE(NEW.address_county, '') || ' ' ||
    COALESCE(NEW.address_country, '') || ' ' ||
    COALESCE(NEW.registration_number, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.acnc_abn, '') || ' ' ||
    COALESCE(NEW.acnc_charity_legal_name, '') || ' ' ||
    COALESCE(NEW.acnc_other_organisation_names, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create ACNC cron logs table for execution tracking
CREATE TABLE IF NOT EXISTS acnc_cron_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL, -- 'started', 'completed', 'error'
  batch_size integer,
  offset_value integer,
  processed_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  response_data jsonb,
  error_message text,
  duration_ms integer
);

-- Enable RLS on acnc_cron_logs
ALTER TABLE acnc_cron_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for acnc_cron_logs (service role access only)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'acnc_cron_logs' 
        AND policyname = 'acnc_cron_logs_service_role_policy'
    ) THEN
        CREATE POLICY "acnc_cron_logs_service_role_policy" ON acnc_cron_logs
          FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Set up ACNC charity processing cron job
-- Runs every 2 hours to process ACNC charities in batches
-- First unschedule if it exists, then schedule
SELECT cron.unschedule('acnc-charity-processing');

SELECT cron.schedule(
  'acnc-charity-processing',
  '0 */2 * * *', -- Every 2 hours
  $$
    SELECT net.http_post(
      url := current_setting('app.base_url') || '/functions/v1/acnc_populate_cache',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'batch_size', 100,
        'offset', 0
      )
    );
  $$
);

-- Add comments for documentation
COMMENT ON COLUMN organization_cache.platform IS 'Donation platform: justgiving, everyorg, or acnc';
COMMENT ON COLUMN organization_cache.acnc_abn IS 'Australian Business Number for ACNC registered charities';
COMMENT ON COLUMN organization_cache.acnc_charity_legal_name IS 'Official legal name from ACNC register';
COMMENT ON COLUMN organization_cache.acnc_purposes IS 'JSONB storing ACNC charity purposes (advancing_education, advancing_health, etc.)';
COMMENT ON COLUMN organization_cache.acnc_beneficiaries IS 'JSONB storing ACNC beneficiary groups (children, aged_persons, etc.)';
COMMENT ON TABLE acnc_cron_logs IS 'Execution logs for ACNC charity cache population cron job';