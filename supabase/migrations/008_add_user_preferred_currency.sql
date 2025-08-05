-- Add preferred_currency field to users table
-- Supporting: GBP, USD, CAD, AUD, EUR

-- Create enum for supported currencies
CREATE TYPE currency_code AS ENUM ('GBP', 'USD', 'CAD', 'AUD', 'EUR');

-- Add preferred_currency column to users table
ALTER TABLE users 
ADD COLUMN preferred_currency currency_code DEFAULT 'GBP';

-- Add comment explaining the field
COMMENT ON COLUMN users.preferred_currency IS 'User preferred currency for donations and pricing display';