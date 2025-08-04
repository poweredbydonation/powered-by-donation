-- Migration 007: Add Exchange Rates Table
-- Creates exchange rates table for currency conversion with sample rates

-- Exchange rates table for currency conversion (hourly updates)
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL CHECK (from_currency IN ('GBP', 'USD', 'EUR', 'CAD', 'AUD')),
  to_currency TEXT NOT NULL CHECK (to_currency IN ('GBP', 'USD', 'EUR', 'CAD', 'AUD')),
  rate DECIMAL(12, 6) NOT NULL, -- Exchange rate with 6 decimal precision
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unique index to ensure one rate per currency pair per hour
CREATE UNIQUE INDEX idx_exchange_rates_unique_hour 
ON exchange_rates (from_currency, to_currency, DATE_TRUNC('hour', created_at));

-- Index for fast rate lookups
CREATE INDEX idx_exchange_rates_currencies_time ON exchange_rates (from_currency, to_currency, created_at DESC);

-- Insert sample exchange rates (approximate rates as of 2024)
-- All rates are TO AUD (Australian Dollar)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
-- British Pound to AUD
('GBP', 'AUD', 1.90),
-- US Dollar to AUD  
('USD', 'AUD', 1.50),
-- Euro to AUD
('EUR', 'AUD', 1.65),
-- Canadian Dollar to AUD
('CAD', 'AUD', 1.10),
-- AUD to AUD (identity)
('AUD', 'AUD', 1.00),
-- Reverse rates (AUD to other currencies)
('AUD', 'GBP', 0.526),
('AUD', 'USD', 0.667),
('AUD', 'EUR', 0.606),
('AUD', 'CAD', 0.909);

-- Comments for documentation
COMMENT ON TABLE exchange_rates IS 'Exchange rates for currency conversion - updated hourly via external process';