-- Migration 003: Add Happiness Metrics and Mutual Feedback System
-- Based on CLAUDE.md mutual happiness system requirements

-- Add happiness metrics for reputation system to providers
ALTER TABLE providers
ADD COLUMN received_happiness INTEGER DEFAULT NULL,  -- % of supporters who rated them 'happy'
ADD COLUMN sent_happiness INTEGER DEFAULT NULL;      -- % of supporters this provider rated 'happy'

-- Add happiness metrics to supporters
ALTER TABLE supporters  
ADD COLUMN received_happiness INTEGER DEFAULT NULL,  -- % of providers who rated them 'happy'
ADD COLUMN sent_happiness INTEGER DEFAULT NULL;      -- % of providers/services they rated 'happy'

-- Add happiness metrics to services
ALTER TABLE services
ADD COLUMN happiness_rate INTEGER DEFAULT NULL;      -- % supporter satisfaction for this service

-- Enhanced service_requests for mutual feedback
ALTER TABLE service_requests 
ADD COLUMN provider_rates_supporter TEXT CHECK (provider_rates_supporter IN ('happy', 'unhappy') OR provider_rates_supporter IS NULL),    -- 'happy', 'unhappy', null
ADD COLUMN supporter_rates_provider TEXT CHECK (supporter_rates_provider IN ('happy', 'unhappy') OR supporter_rates_provider IS NULL),    -- 'happy', 'unhappy', null  
ADD COLUMN supporter_rates_service TEXT CHECK (supporter_rates_service IN ('happy', 'unhappy') OR supporter_rates_service IS NULL);       -- 'happy', 'unhappy', null

-- Add supporter happiness requirements to services (optional quality control)
ALTER TABLE services
ADD COLUMN supporter_happiness_requirements JSONB DEFAULT NULL; -- {"min_received_happiness": 85, "min_total_interactions": 5}

-- Add indexes for happiness-based filtering
CREATE INDEX idx_providers_received_happiness ON providers(received_happiness) WHERE received_happiness IS NOT NULL;
CREATE INDEX idx_supporters_received_happiness ON supporters(received_happiness) WHERE received_happiness IS NOT NULL;
CREATE INDEX idx_services_happiness_rate ON services(happiness_rate) WHERE happiness_rate IS NOT NULL;
CREATE INDEX idx_service_requests_ratings ON service_requests(provider_rates_supporter, supporter_rates_provider, supporter_rates_service);

-- Add comments for clarity
COMMENT ON COLUMN providers.received_happiness IS 'Percentage of supporters who rated this provider as happy';
COMMENT ON COLUMN providers.sent_happiness IS 'Percentage of supporters this provider rated as happy';
COMMENT ON COLUMN supporters.received_happiness IS 'Percentage of providers who rated this supporter as happy';
COMMENT ON COLUMN supporters.sent_happiness IS 'Percentage of interactions this supporter rated as happy';
COMMENT ON COLUMN services.happiness_rate IS 'Percentage of supporters who rated this service as happy';
COMMENT ON COLUMN services.supporter_happiness_requirements IS 'JSON object with minimum happiness requirements for supporters to access this service';
COMMENT ON COLUMN service_requests.provider_rates_supporter IS 'Provider rating of supporter experience (happy/unhappy)';
COMMENT ON COLUMN service_requests.supporter_rates_provider IS 'Supporter rating of provider experience (happy/unhappy)';
COMMENT ON COLUMN service_requests.supporter_rates_service IS 'Supporter rating of service quality (happy/unhappy)';