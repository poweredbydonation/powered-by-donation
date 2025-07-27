-- Migration 002: Create Enums and Foreign Key Constraints
-- Based on CLAUDE.md database schema requirements

-- Create enums for better type safety
CREATE TYPE charity_requirement_enum AS ENUM (
  'any_charity',        -- "Donate to any JustGiving charity"
  'specific_charities'  -- "Donate to one of my preferred charities"
);

CREATE TYPE service_status AS ENUM (
  'pending',                    -- Donation made, provider notified
  'success',                    -- Supporter happy or timeout (positive outcome)
  'provider_review',            -- Supporter unhappy, waiting for provider response
  'acknowledged_feedback',      -- Provider accepts feedback
  'disputed_feedback',          -- Provider disputes feedback
  'unresponsive_to_feedback'    -- Provider ignored feedback
);

-- Update services table to use proper enum
ALTER TABLE services 
DROP CONSTRAINT services_charity_requirement_type_check;

ALTER TABLE services 
ALTER COLUMN charity_requirement_type TYPE charity_requirement_enum USING charity_requirement_type::charity_requirement_enum;

-- Update service_requests table to use proper enum
ALTER TABLE service_requests 
DROP CONSTRAINT service_requests_status_check;

-- Drop the default before changing type, then re-add it
ALTER TABLE service_requests 
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE service_requests 
ALTER COLUMN status TYPE service_status USING status::service_status;

ALTER TABLE service_requests 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add foreign key constraints
ALTER TABLE services 
ADD CONSTRAINT fk_services_provider 
FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE;

ALTER TABLE service_requests 
ADD CONSTRAINT fk_service_requests_supporter 
FOREIGN KEY (supporter_id) REFERENCES supporters(id) ON DELETE CASCADE;

ALTER TABLE service_requests 
ADD CONSTRAINT fk_service_requests_provider 
FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE;

ALTER TABLE service_requests 
ADD CONSTRAINT fk_service_requests_service 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

ALTER TABLE service_requests 
ADD CONSTRAINT fk_service_requests_charity 
FOREIGN KEY (justgiving_charity_id) REFERENCES charity_cache(justgiving_charity_id);

-- Add performance indexes for foreign keys
CREATE INDEX idx_services_provider_fk ON services(provider_id);
CREATE INDEX idx_service_requests_supporter_fk ON service_requests(supporter_id);
CREATE INDEX idx_service_requests_provider_fk ON service_requests(provider_id);
CREATE INDEX idx_service_requests_service_fk ON service_requests(service_id);
CREATE INDEX idx_service_requests_charity_fk ON service_requests(justgiving_charity_id);

-- Add indexes for common queries
CREATE INDEX idx_services_available_dates ON services(available_from, available_until);
CREATE INDEX idx_services_donation_amount ON services(donation_amount);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at);
CREATE INDEX idx_charity_cache_stats ON charity_cache(total_donations_count, total_amount_received);