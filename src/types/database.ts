// Database Types - Generated from Supabase Schema
// Based on CLAUDE.md database schema requirements

// Enum Types
export type CharityRequirementType = 'any_charity' | 'specific_charities';

export type ServiceStatus = 
  | 'pending' 
  | 'success' 
  | 'provider_review' 
  | 'acknowledged_feedback' 
  | 'disputed_feedback' 
  | 'unresponsive_to_feedback';

export type SatisfactionStatus = 'happy' | 'unhappy' | 'timeout';

export type FeedbackResponse = 'will_improve' | 'disagree' | 'timeout';

export type HappinessRating = 'happy' | 'unhappy';

// Core Database Interfaces

export interface User {
  id: string; // UUID
  email: string;
  name: string;
  username?: string;
  is_provider?: boolean;
  is_supporter?: boolean;
  bio?: string;
  location?: string;
  phone?: string;
  avatar_url?: string;
  created_at?: Date;
}

// Legacy interfaces for backward compatibility (deprecated - use User instead)
export interface Provider extends User {
  is_provider: true;
}

export interface Supporter extends User {
  is_supporter: true;
}

export interface Service {
  id: string; // UUID
  user_id: string; // UUID (foreign key to users table)
  title: string;
  description?: string;
  donation_amount: number; // Fixed amount required
  charity_requirement_type: CharityRequirementType;
  preferred_charities?: Record<string, unknown>; // JSONB - Array of JustGiving charity IDs
  available_from: Date;
  available_until?: Date;
  max_supporters?: number;
  current_supporters?: number;
  service_locations: Record<string, unknown>; // JSONB - Array of location options
  show_in_directory?: boolean;
  is_active?: boolean;
  created_at?: Date;
  happiness_rate?: number; // % supporter satisfaction (calculated from service_requests)
}

export interface CharityCache {
  justgiving_charity_id: string;
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  slug: string; // SEO-friendly URL slug
  total_donations_count?: number;
  total_amount_received?: number;
  this_month_count?: number;
  this_month_amount?: number;
  service_categories?: Record<string, unknown>; // JSONB - Service category breakdown
  is_active?: boolean;
  is_featured?: boolean;
  page_views?: number;
  last_updated?: Date;
  stats_last_updated?: Date;
}

export interface ServiceRequest {
  id: string; // UUID
  supporter_id: string; // UUID (foreign key to users table)
  provider_id: string; // UUID (foreign key to users table)
  service_id: string; // UUID (foreign key to services)
  justgiving_charity_id: string;
  donation_amount: number;
  charity_name?: string;
  status?: ServiceStatus;
  supporter_satisfaction?: SatisfactionStatus;
  provider_feedback_response?: FeedbackResponse;
  satisfaction_check_sent_at?: Date;
  supporter_responded_at?: Date;
  provider_feedback_sent_at?: Date;
  provider_responded_at?: Date;
  created_at?: Date;
  provider_rates_supporter?: HappinessRating;
  supporter_rates_provider?: HappinessRating;
  supporter_rates_service?: HappinessRating;
}

// Service Location Structure (for service_locations JSONB field)
export interface ServiceLocation {
  type: 'physical' | 'remote' | 'hybrid';
  address?: string; // "123 Main St, Sydney NSW"
  area?: string; // "Sydney CBD", "Melbourne Eastern Suburbs"
  radius?: number; // km from base location
  travel_fee?: number; // Optional travel cost
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Supporter Happiness Requirements (for supporter_happiness_requirements JSONB field)
export interface SupporterHappinessRequirements {
  min_received_happiness?: number; // Supporter must be X% liked by providers
  min_total_interactions?: number; // Supporter must have X+ completed services
}

// Charity Page Data (for public charity pages)
export interface CharityPageData {
  justgiving_charity_id: string;
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  slug: string;
  stats: {
    total_donations_count: number;
    total_amount_received: number;
    this_month_count: number;
    this_month_amount: number;
  };
  service_categories: Record<string, number>; // {"web_design": 45, "tutoring": 23}
  recent_activity: Array<{
    amount: number;
    service_title: string;
    created_at: Date;
    // NO donor information whatsoever - always anonymous
  }>;
}

// Public Platform Statistics (anonymous aggregate data)
export interface PlatformStats {
  total_services: number;
  total_providers: number;
  services_this_month: number;
  donations_this_month: number;
  total_amount_this_month: number;
  charities_supported: number;
  active_providers: number;
}

// Anonymous Donation Activity (for public display)
export interface PublicDonationActivity {
  donation_amount: number;
  service_title: string;
  charity_name: string;
  created_at: Date;
  donor_name: 'Anonymous'; // Always anonymous per CLAUDE.md privacy model
}