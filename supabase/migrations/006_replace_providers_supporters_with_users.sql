-- Migration: Replace providers and supporters tables with single users table
-- This migration consolidates the separate providers and supporters tables into a unified users table

-- Drop existing foreign key constraints and tables
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS supporters CASCADE;
DROP TABLE IF EXISTS providers CASCADE;

-- Create unified users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    is_provider BOOLEAN DEFAULT false,
    is_supporter BOOLEAN DEFAULT true,
    bio TEXT,
    location TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_is_provider ON users(is_provider) WHERE is_provider = true;
CREATE INDEX idx_users_is_supporter ON users(is_supporter) WHERE is_supporter = true;
CREATE INDEX idx_users_location ON users(location) WHERE location IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view all public profiles
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT
    USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON users
    FOR DELETE
    USING (auth.uid() = id);

-- Recreate services table with updated foreign key to users
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    donation_amount DECIMAL NOT NULL,
    charity_requirement_type TEXT NOT NULL CHECK (charity_requirement_type IN ('any_charity', 'specific_charities')),
    preferred_charities JSONB,
    available_from DATE NOT NULL,
    available_until DATE,
    max_supporters INTEGER,
    current_supporters INTEGER DEFAULT 0,
    service_locations JSONB NOT NULL,
    show_in_directory BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for services table
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_is_active ON services(is_active) WHERE is_active = true;
CREATE INDEX idx_services_show_in_directory ON services(show_in_directory) WHERE show_in_directory = true;
CREATE INDEX idx_services_donation_amount ON services(donation_amount);
CREATE INDEX idx_services_available_from ON services(available_from);
CREATE INDEX idx_services_created_at ON services(created_at);

-- Enable RLS for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT
    USING (is_active = true AND show_in_directory = true);

CREATE POLICY "Users can view their own services" ON services
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own services" ON services
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own services" ON services
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own services" ON services
    FOR DELETE
    USING (user_id = auth.uid());

-- Recreate service_requests table with updated foreign keys
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    justgiving_charity_id TEXT NOT NULL,
    donation_amount DECIMAL NOT NULL,
    charity_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'provider_review', 'acknowledged_feedback', 'disputed_feedback', 'unresponsive_to_feedback')),
    supporter_satisfaction TEXT CHECK (supporter_satisfaction IN ('happy', 'unhappy', 'timeout')),
    provider_feedback_response TEXT CHECK (provider_feedback_response IN ('will_improve', 'disagree', 'timeout')),
    satisfaction_check_sent_at TIMESTAMP WITH TIME ZONE,
    supporter_responded_at TIMESTAMP WITH TIME ZONE,
    provider_feedback_sent_at TIMESTAMP WITH TIME ZONE,
    provider_responded_at TIMESTAMP WITH TIME ZONE,
    provider_rates_supporter TEXT CHECK (provider_rates_supporter IN ('happy', 'unhappy')),
    supporter_rates_provider TEXT CHECK (supporter_rates_provider IN ('happy', 'unhappy')),
    supporter_rates_service TEXT CHECK (supporter_rates_service IN ('happy', 'unhappy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for service_requests
CREATE INDEX idx_service_requests_supporter_id ON service_requests(supporter_id);
CREATE INDEX idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at);

-- Enable RLS for service_requests
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_requests
CREATE POLICY "Users can view their own service requests as supporter" ON service_requests
    FOR SELECT
    USING (supporter_id = auth.uid());

CREATE POLICY "Users can view their own service requests as provider" ON service_requests
    FOR SELECT
    USING (provider_id = auth.uid());

CREATE POLICY "Supporters can insert service requests" ON service_requests
    FOR INSERT
    WITH CHECK (supporter_id = auth.uid());

CREATE POLICY "Users can update their own service requests as supporter" ON service_requests
    FOR UPDATE
    USING (supporter_id = auth.uid())
    WITH CHECK (supporter_id = auth.uid());

CREATE POLICY "Users can update their own service requests as provider" ON service_requests
    FOR UPDATE
    USING (provider_id = auth.uid())
    WITH CHECK (provider_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE users IS 'Unified users table combining providers and supporters';
COMMENT ON COLUMN users.is_provider IS 'True if user offers services';
COMMENT ON COLUMN users.is_supporter IS 'True if user can make donations (default)';
COMMENT ON COLUMN users.username IS 'Optional unique username for profiles';

COMMENT ON TABLE services IS 'Services offered by provider users';
COMMENT ON COLUMN services.user_id IS 'References users table (must be a provider)';

COMMENT ON TABLE service_requests IS 'Donation requests between supporters and providers';
COMMENT ON COLUMN service_requests.supporter_id IS 'User making the donation';
COMMENT ON COLUMN service_requests.provider_id IS 'User providing the service';