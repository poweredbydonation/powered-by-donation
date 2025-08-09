// Database Types - Generated from Supabase Schema
// Based on CLAUDE.md database schema requirements

// Enum Types
export type CharityRequirementType = 'any_charity' | 'specific_charities';

export type CurrencyCode = 'GBP' | 'USD' | 'CAD' | 'AUD' | 'EUR';

export type DonationPlatform = 'justgiving' | 'every_org';

export type ServiceStatus = 
  | 'pending' 
  | 'success' 
  | 'fundraiser_review' 
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
  is_fundraiser?: boolean;
  is_donor?: boolean;
  bio?: string;
  location?: string;
  phone?: string;
  avatar_url?: string;
  preferred_currency?: CurrencyCode;
  preferred_platform?: DonationPlatform;
  created_at?: Date;
}

// Legacy interfaces for backward compatibility (deprecated - use User instead)
export interface Fundraiser extends User {
  is_fundraiser: true;
}

export interface Donor extends User {
  is_donor: true;
}

// Old interfaces - deprecated but kept for backward compatibility
export interface Provider extends User {
  is_fundraiser: true; // Updated to use new column name
}

export interface Supporter extends User {
  is_donor: true; // Updated to use new column name
}

export interface Service {
  id: string; // UUID
  user_id: string; // UUID (foreign key to users table)
  title: string;
  description?: string;
  donation_amount: number; // Always AUD amount from pricing tier
  pricing_tier_id?: number; // Foreign key to pricing_tiers table
  charity_requirement_type: CharityRequirementType;
  preferred_charities?: Record<string, unknown>; // JSONB - Array of platform organization IDs
  platform?: DonationPlatform;
  organization_id?: string; // Platform-specific charity/nonprofit ID
  organization_name?: string; // Cached organization name
  organization_data?: Record<string, unknown>; // JSONB - Full platform organization data
  available_from: Date;
  available_until?: Date;
  max_donors?: number;
  current_donors?: number;
  service_locations: Record<string, unknown>; // JSONB - Array of location options
  show_in_directory?: boolean;
  is_active?: boolean;
  created_at?: Date;
  happiness_rate?: number; // % donor satisfaction (calculated from service_requests)
}

// Legacy interface - use JustGivingCharityCache or EveryOrgNonprofitCache instead
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

export interface JustGivingCharityCache {
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

export interface EveryOrgNonprofitCache {
  nonprofit_ein: string; // Every.org uses EIN as primary identifier
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
  donor_id: string; // UUID (foreign key to users table)
  fundraiser_id: string; // UUID (foreign key to users table)
  service_id: string; // UUID (foreign key to services)
  platform?: DonationPlatform;
  reference_id?: string; // PD-JG-1000 or PD-EV-1000
  organization_id?: string; // Platform-specific organization ID
  organization_name?: string; // Cached organization name
  donation_url?: string; // Generated donation URL
  external_donation_id?: string; // Platform's donation ID after completion
  timeout_at?: Date; // When to timeout pending donations
  // Legacy fields for backward compatibility
  justgiving_charity_id: string;
  donation_amount: number;
  charity_name?: string;
  status?: ServiceStatus;
  donor_satisfaction?: SatisfactionStatus;
  fundraiser_feedback_response?: FeedbackResponse;
  satisfaction_check_sent_at?: Date;
  donor_responded_at?: Date;
  fundraiser_feedback_sent_at?: Date;
  fundraiser_responded_at?: Date;
  created_at?: Date;
  fundraiser_rates_donor?: HappinessRating;
  donor_rates_fundraiser?: HappinessRating;
  donor_rates_service?: HappinessRating;
}

// Service Location Structure (for service_locations JSONB field)
export interface ServiceLocation {
  type: 'physical' | 'remote' | 'hybrid';
  address?: string; // "123 Main St, Sydney NSW"
  area?: string; // "Sydney CBD", "Melbourne Eastern Suburbs"
  radius?: number; // km from base location
  travel_fee?: number; // Optional travel cost
  latitude?: number; // Direct latitude property
  longitude?: number; // Direct longitude property
}

// Donor Happiness Requirements (for donor_happiness_requirements JSONB field)
export interface DonorHappinessRequirements {
  min_received_happiness?: number; // Donor must be X% liked by fundraisers
  min_total_interactions?: number; // Donor must have X+ completed services
}

// Legacy interface - deprecated
export interface SupporterHappinessRequirements {
  min_received_happiness?: number;
  min_total_interactions?: number;
}

// Organization Page Data (platform-aware for public charity/nonprofit pages)
export interface OrganizationPageData {
  platform: DonationPlatform;
  organization_id: string; // justgiving_charity_id or nonprofit_ein
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

// Legacy interface for backward compatibility
export interface CharityPageData extends OrganizationPageData {
  justgiving_charity_id: string;
  platform: 'justgiving';
}

// Public Platform Statistics (anonymous aggregate data)
export interface PlatformStats {
  total_services: number;
  total_fundraisers: number;
  services_this_month: number;
  justgiving_services: number;
  every_org_services: number;
  donations_this_month: number;
  total_amount_this_month: number;
  charities_supported: number;
  active_fundraisers: number;
}

// Anonymous Donation Activity (for public display)
export interface PublicDonationActivity {
  donation_amount: number;
  service_title: string;
  organization_name: string; // Platform-agnostic organization name
  platform: DonationPlatform;
  created_at: Date;
  donor_name: 'Anonymous'; // Always anonymous per CLAUDE.md privacy model
  // Legacy field for backward compatibility
  charity_name?: string;
}

// Pricing Tiers for standardized service pricing
export interface PricingTier {
  id: number;
  tier_name: string;
  tier_order: number;
  use_case: string;
  price_aud: number;
  price_usd: number;
  price_eur: number;
  price_gbp: number;
  price_cad: number;
  is_active?: boolean;
  created_at?: Date;
}

// Platform-specific organization search results
export interface JustGivingCharity {
  id: string;
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  website?: string;
}

export interface EveryOrgNonprofit {
  ein: string;
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  website?: string;
}

// Unified organization interface for frontend
export interface Organization {
  id: string; // justgiving id or every.org ein
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  website?: string;
  platform: DonationPlatform;
}

// Donation URL generation parameters
export interface DonationUrlParams {
  platform: DonationPlatform;
  organization_id: string;
  amount: number;
  currency: CurrencyCode;
  reference_id: string;
  return_url: string;
}

// Platform-specific computed fields for services (used in queries)
export interface ServiceWithPlatformFields extends Service {
  platform_organization_id: string; // Computed field based on platform
  platform_organization_name: string; // Computed field based on platform
}