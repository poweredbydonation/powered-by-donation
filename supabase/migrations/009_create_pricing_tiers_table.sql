-- Create pricing tiers table for standardized service pricing
-- Supporting multi-currency pricing tiers for consistent platform experience

CREATE TABLE pricing_tiers (
    id SERIAL PRIMARY KEY,
    tier_name TEXT NOT NULL UNIQUE,
    tier_order INTEGER NOT NULL UNIQUE,
    use_case TEXT NOT NULL,
    price_aud DECIMAL(10,2) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    price_eur DECIMAL(10,2) NOT NULL,
    price_gbp DECIMAL(10,2) NOT NULL,
    price_cad DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert pricing tier data
INSERT INTO pricing_tiers (tier_name, tier_order, use_case, price_aud, price_usd, price_eur, price_gbp, price_cad) VALUES
('Starter', 1, 'Quick questions, micro-tasks', 10.00, 5.00, 10.00, 5.00, 10.00),
('Standard', 2, 'Most popular - consultations', 20.00, 15.00, 20.00, 10.00, 20.00),
('Enhanced', 3, 'Premium quick services', 25.00, 20.00, 25.00, 15.00, 25.00),
('Professional', 4, 'Detailed work', 50.00, 35.00, 45.00, 25.00, 50.00),
('Premium', 5, 'High-value services', 100.00, 75.00, 85.00, 50.00, 100.00),
('Expert', 6, 'Complex projects', 200.00, 150.00, 170.00, 100.00, 200.00);

-- Create index for performance
CREATE INDEX idx_pricing_tiers_active ON pricing_tiers(is_active) WHERE is_active = true;
CREATE INDEX idx_pricing_tiers_order ON pricing_tiers(tier_order);

-- Add comments for documentation
COMMENT ON TABLE pricing_tiers IS 'Standardized pricing tiers for services with multi-currency support';
COMMENT ON COLUMN pricing_tiers.tier_order IS 'Order for displaying tiers (1 = lowest, 6 = highest)';
COMMENT ON COLUMN pricing_tiers.use_case IS 'Description of what this tier is suitable for';

-- Enable RLS
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active pricing tiers
CREATE POLICY "Public can view active pricing tiers"
ON pricing_tiers FOR SELECT
TO public
USING (is_active = true);