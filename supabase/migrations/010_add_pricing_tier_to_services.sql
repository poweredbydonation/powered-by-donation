-- Add pricing_tier_id to services table for standardized pricing
-- Always store AUD amounts as base currency (Australian business)

-- Add pricing_tier_id column
ALTER TABLE services 
ADD COLUMN pricing_tier_id INTEGER REFERENCES pricing_tiers(id);

-- Update existing services to map to appropriate pricing tiers based on donation_amount
-- This ensures no constraint violations for existing data
UPDATE services 
SET pricing_tier_id = (
  CASE 
    WHEN donation_amount <= 10 THEN 1  -- Starter tier
    WHEN donation_amount <= 20 THEN 2  -- Standard tier  
    WHEN donation_amount <= 25 THEN 3  -- Enhanced tier
    WHEN donation_amount <= 50 THEN 4  -- Professional tier
    WHEN donation_amount <= 100 THEN 5 -- Premium tier
    ELSE 6                             -- Expert tier
  END
)
WHERE pricing_tier_id IS NULL;

-- Update donation_amount comment to clarify it's always AUD
COMMENT ON COLUMN services.donation_amount IS 'Always AUD amount from selected pricing tier';

-- Create index for performance
CREATE INDEX idx_services_pricing_tier_id ON services(pricing_tier_id);

-- Now that all existing services have tier_id, we can make it required for new services
ALTER TABLE services 
ADD CONSTRAINT chk_services_have_tier 
CHECK (pricing_tier_id IS NOT NULL);