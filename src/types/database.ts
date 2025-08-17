// Database Types - Generated from Supabase Schema
// Based on CLAUDE.md database schema requirements

// Enum Types
export type CharityRequirementType = 'any_charity' | 'specific_charities';

// Platform Requirements Types (New Multi-Platform System)
export type PlatformRestrictionType = 'any_platform' | 'specific_platforms' | 'mixed_selection';

export type EntityRestrictionType = 'any_entities' | 'specific_entities';

export type OrganizationRestrictionType = 'any_organizations' | 'specific_organizations';

export interface PlatformRule {
  entity_types: EntityRestrictionType;
  allowed_entities: string[]; // ['charity', 'nonprofit', etc.]
  organizations: OrganizationRestrictionType;
  specific_organizations: string[]; // Array of organization_cache IDs
  select_all_organizations?: boolean; // Flag indicating all organizations are selected
  excluded_organizations?: string[]; // Array of organization IDs to exclude when select_all is true
}

export interface PlatformRequirements {
  type: PlatformRestrictionType;
  allowed_platforms: DonationPlatform[];
  platform_rules: Record<DonationPlatform, PlatformRule>;
}

export type CurrencyCode = 'GBP' | 'USD' | 'CAD' | 'AUD' | 'EUR';

export type DonationPlatform = 'justgiving' | 'everyorg' | 'acnc';

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

// Unified Organization Cache Interface (Platform-First Architecture)
export interface OrganizationCache {
  id: string; // UUID
  platform: DonationPlatform;
  external_id: string; // justgiving_charity_id or nonprofit_ein
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  slug: string; // SEO-friendly URL slug
  
  // Donation stats (common to both platforms)
  total_donations_count?: number;
  total_amount_received?: number;
  this_month_count?: number;
  this_month_amount?: number;
  service_categories?: Record<string, unknown>; // JSONB - Service category breakdown
  
  // Platform management
  is_active?: boolean;
  is_featured?: boolean;
  page_views?: number;
  last_updated?: Date;
  stats_last_updated?: Date;
  
  // Enhanced details (primarily from JustGiving)
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_county?: string;
  address_country?: string;
  address_postcode?: string;
  display_name?: string;
  logo_absolute_url?: string;
  profile_page_url?: string;
  registration_number?: string;
  website_url?: string;
  email_address?: string;
  keywords?: string;
  
  // JustGiving specific fields
  page_short_name?: string;
  sms_short_name?: string;
  is_approved?: boolean;
  show_in_search?: boolean;
  date_added_to_justgiving?: Date;
  thankyou_message?: string;
  impact_statement_what?: string;
  impact_statement_why?: string;
  country_code?: string;
  currency_code?: string;
  mobile_appeals?: Record<string, unknown>; // JSONB
  donation_display_amounts?: Record<string, unknown>; // JSONB
  theme_colour?: Record<string, unknown>; // JSONB
  categories_list?: Record<string, unknown>; // JSONB
  
  // API management
  enhanced_data_fetched_at?: Date;
  api_fetch_attempts?: number;
  
  // ACNC specific fields
  acnc_abn?: string;
  acnc_charity_legal_name?: string;
  acnc_other_organisation_names?: string;
  acnc_address_type?: string;
  acnc_registration_date?: string;
  acnc_date_organisation_established?: string;
  acnc_charity_size?: string;
  acnc_number_of_responsible_persons?: string;
  acnc_financial_year_end?: string;
  acnc_operates_in_act?: string;
  acnc_operates_in_nsw?: string;
  acnc_operates_in_nt?: string;
  acnc_operates_in_qld?: string;
  acnc_operates_in_sa?: string;
  acnc_operates_in_tas?: string;
  acnc_operates_in_vic?: string;
  acnc_operates_in_wa?: string;
  acnc_operating_countries?: string;
  acnc_pbi?: string;
  acnc_hpc?: string;
  acnc_purposes?: Record<string, unknown>; // JSONB
  acnc_beneficiaries?: Record<string, unknown>; // JSONB
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
  // New platform requirements system
  platform_requirements?: PlatformRequirements; // JSONB - Full platform hierarchy rules
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

// Legacy interface - use OrganizationCache instead
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
  
  // Enhanced charity details from GetCharityById API
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_county?: string;
  address_country?: string;
  address_postcode?: string;
  display_name?: string;
  logo_absolute_url?: string;
  profile_page_url?: string;
  registration_number?: string;
  website_url?: string;
  email_address?: string;
  keywords?: string;
  page_short_name?: string;
  sms_short_name?: string;
  is_approved?: boolean;
  show_in_search?: boolean;
  date_added_to_justgiving?: Date;
  thankyou_message?: string;
  impact_statement_what?: string;
  impact_statement_why?: string;
  country_code?: string;
  currency_code?: string;
  mobile_appeals?: Record<string, unknown>; // JSONB
  donation_display_amounts?: Record<string, unknown>; // JSONB
  theme_colour?: Record<string, unknown>; // JSONB
  categories_list?: Record<string, unknown>; // JSONB - renamed from categories to avoid conflict
  enhanced_data_fetched_at?: Date;
  api_fetch_attempts?: number;
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

// Organization filter and search parameters for Platform-First architecture
export interface OrganizationSearchParams {
  platform?: DonationPlatform;
  category?: string;
  city?: string;
  country_code?: string;
  search?: string;
  is_featured?: boolean;
  preferred_only?: boolean; // Show only organizations preferred by services
  page?: number;
  limit?: number;
}

// Unified organization response for API endpoints
export interface OrganizationSearchResponse {
  organizations: OrganizationCache[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
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
  everyorg_services: number;
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