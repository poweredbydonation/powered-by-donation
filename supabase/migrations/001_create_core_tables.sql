-- Migration 001: Create Core Tables
-- Based on CLAUDE.md database schema requirements

-- Create charity cache table first (referenced by other tables)
CREATE TABLE charity_cache (
  justgiving_charity_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  logo_url TEXT,
  slug TEXT UNIQUE NOT NULL,               -- SEO-friendly URL slug
  
  -- Anonymous donation statistics
  total_donations_count INTEGER DEFAULT 0,
  total_amount_received DECIMAL DEFAULT 0,
  this_month_count INTEGER DEFAULT 0,
  this_month_amount DECIMAL DEFAULT 0,
  
  -- Service category breakdown (JSONB for flexibility)
  service_categories JSONB DEFAULT '{}',   -- {"web_design": 15, "tutoring": 8, "consulting": 23}
  
  -- Page management
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  page_views INTEGER DEFAULT 0,
  
  last_updated TIMESTAMP DEFAULT NOW(),
  stats_last_updated TIMESTAMP DEFAULT NOW()
);

-- Providers with basic privacy controls
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  photo TEXT,
  contact JSONB,
  show_bio BOOLEAN DEFAULT true,
  show_contact BOOLEAN DEFAULT false,
  show_in_directory BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supporters with basic privacy
CREATE TABLE supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  bio TEXT,
  photo TEXT,
  contact JSONB,
  show_bio BOOLEAN DEFAULT false,
  show_donation_history BOOLEAN DEFAULT false,
  show_in_directory BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Services with availability, capacity, and charity requirements
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Fixed donation amount requirement
  donation_amount DECIMAL NOT NULL,        -- Exact amount required (e.g., $50)
  
  -- Charity requirements (will add enum in next migration)
  charity_requirement_type TEXT NOT NULL CHECK (charity_requirement_type IN ('any_charity', 'specific_charities')),
  preferred_charities JSONB,              -- Array of JustGiving charity IDs (when specific)
  
  -- Availability and capacity
  available_from DATE NOT NULL,           -- Service available from this date
  available_until DATE,                   -- Optional end date (NULL = ongoing)
  max_supporters INTEGER,                 -- Optional capacity limit (NULL = unlimited)
  current_supporters INTEGER DEFAULT 0,   -- Track current bookings
  
  -- Location options
  service_locations JSONB NOT NULL,       -- Array of location options
  
  -- Visibility controls
  show_in_directory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service request tracking with satisfaction feedback
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  service_id UUID NOT NULL,
  justgiving_charity_id TEXT NOT NULL,
  donation_amount DECIMAL NOT NULL,       -- Fixed amount from service
  charity_name TEXT,
  
  -- Status and feedback tracking (will add enum in next migration)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'provider_review', 'acknowledged_feedback', 'disputed_feedback', 'unresponsive_to_feedback')),
  supporter_satisfaction TEXT CHECK (supporter_satisfaction IN ('happy', 'unhappy', 'timeout') OR supporter_satisfaction IS NULL),
  provider_feedback_response TEXT CHECK (provider_feedback_response IN ('will_improve', 'disagree', 'timeout') OR provider_feedback_response IS NULL),
  
  -- Timing for follow-ups
  satisfaction_check_sent_at TIMESTAMP,
  supporter_responded_at TIMESTAMP,
  provider_feedback_sent_at TIMESTAMP,
  provider_responded_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add basic indexes for performance
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_charity_requirement ON services(charity_requirement_type);
CREATE INDEX idx_services_active ON services(is_active, show_in_directory);
CREATE INDEX idx_service_requests_supporter ON service_requests(supporter_id);
CREATE INDEX idx_service_requests_provider ON service_requests(provider_id);
CREATE INDEX idx_service_requests_service ON service_requests(service_id);
CREATE INDEX idx_service_requests_charity ON service_requests(justgiving_charity_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_charity_cache_slug ON charity_cache(slug);
CREATE INDEX idx_charity_cache_active ON charity_cache(is_active);