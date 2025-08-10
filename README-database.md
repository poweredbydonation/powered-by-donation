# Database Schema & Architecture - Powered by Donation

## Overview

The platform uses a unified user system with Supabase PostgreSQL database, supporting both fundraiser and donor roles through a single `users` table with dual platform support (JustGiving + Every.org). This design simplifies authentication, reduces complexity, enables seamless role switching, and provides platform-specific donation flows with sequential reference generation.

## Core Entity Tables

### Users Table (Unified System with Platform Support)
```sql
-- Unified users table replacing fundraisers and donors
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  location_suburb TEXT,
  location_state TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  
  -- Profile type flags
  is_fundraiser BOOLEAN DEFAULT false,
  is_donor BOOLEAN DEFAULT false,
  
  -- Platform preference
  preferred_platform donation_platform DEFAULT 'justgiving',
  
  -- Privacy controls
  show_bio BOOLEAN DEFAULT true,
  show_contact BOOLEAN DEFAULT false,
  show_in_directory BOOLEAN DEFAULT false,
  show_donation_history BOOLEAN DEFAULT false,
  
  -- Reputation metrics
  received_happiness INTEGER DEFAULT 0,
  sent_happiness INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Services Table (Platform-Aware)
```sql
-- Services with dual platform support and charity requirements
CREATE TABLE services (
  id UUID PRIMARY KEY,
  fundraiser_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Fixed donation amount requirement
  donation_amount DECIMAL NOT NULL,        -- Exact amount required (e.g., $50)
  
  -- Platform-specific organization requirements
  platform donation_platform NOT NULL,    -- Which platform this service uses
  charity_requirement_type charity_requirement_enum NOT NULL,
  preferred_charities JSONB,              -- Array of platform-specific organization IDs
  organization_data JSONB,                -- Full organization data for caching
  organization_name TEXT,                 -- Cached organization name for display
  
  -- Availability and capacity
  available_from DATE NOT NULL,           -- Service available from this date
  available_until DATE,                   -- Optional end date (NULL = ongoing)
  max_donors INTEGER,                     -- Optional capacity limit (NULL = unlimited)
  current_donors INTEGER DEFAULT 0,       -- Track current bookings
  
  -- Location options
  service_locations JSONB NOT NULL,       -- Array of location options
  
  -- Visibility controls
  show_in_directory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Quality metrics
  happiness_rate INTEGER DEFAULT 0,       -- % donor satisfaction for this service
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Service Requests Table (Platform-Aware with Sequential References)
```sql
-- Service request tracking with dual platform support and sequential references
CREATE TABLE service_requests (
  id UUID PRIMARY KEY,
  donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fundraiser_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Platform-specific organization data
  platform donation_platform NOT NULL,    -- 'justgiving' or 'every_org'
  organization_id TEXT NOT NULL,          -- Platform-specific org ID
  organization_name TEXT,                 -- Cached org name for display
  organization_data JSONB,                -- Full org data for reference
  
  -- Sequential reference system
  platform_reference TEXT UNIQUE NOT NULL, -- PD-JG-1001, PD-EV-1001
  external_donation_id TEXT,              -- Platform's donation ID after confirmation
  
  donation_amount DECIMAL NOT NULL,       -- Fixed amount from service
  
  -- Status and feedback tracking
  status service_status DEFAULT 'pending',
  donor_satisfaction TEXT,                -- 'happy', 'unhappy', 'timeout'
  fundraiser_feedback_response TEXT,      -- 'will_improve', 'disagree', 'timeout'
  
  -- Mutual feedback system
  fundraiser_rates_donor TEXT,            -- 'happy', 'unhappy', null
  donor_rates_fundraiser TEXT,            -- 'happy', 'unhappy', null  
  donor_rates_service TEXT,               -- 'happy', 'unhappy', null
  
  -- Timing for follow-ups
  satisfaction_check_sent_at TIMESTAMP,
  donor_responded_at TIMESTAMP,
  fundraiser_feedback_sent_at TIMESTAMP,
  fundraiser_responded_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Platform-Specific Organization Cache Tables

#### JustGiving Charity Cache
```sql
-- JustGiving charity information cache with stats tracking
CREATE TABLE justgiving_charity_cache (
  charity_id TEXT PRIMARY KEY,             -- JustGiving charity ID
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
```

#### Every.org Nonprofit Cache
```sql
-- Every.org nonprofit information cache with stats tracking
CREATE TABLE every_org_nonprofit_cache (
  nonprofit_id TEXT PRIMARY KEY,           -- Every.org nonprofit ID
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
```

## Enums & Types

### Donation Platform Type
```sql
CREATE TYPE donation_platform AS ENUM (
  'justgiving',         -- JustGiving platform
  'every_org'           -- Every.org platform
);
```

### Charity Requirement Types
```sql
CREATE TYPE charity_requirement_enum AS ENUM (
  'any_charity',        -- "Donate to any platform organization"
  'specific_charities'  -- "Donate to one of my preferred organizations"
);
```

### Service Status Flow
```sql
CREATE TYPE service_status AS ENUM (
  'pending',                    -- Donation made, fundraiser notified
  'success',                    -- Donor happy or timeout (positive outcome)
  'fundraiser_review',          -- Donor unhappy, waiting for fundraiser response
  'acknowledged_feedback',      -- Fundraiser accepts feedback
  'disputed_feedback',          -- Fundraiser disputes feedback
  'unresponsive_to_feedback'    -- Fundraiser ignored feedback
);
```

## Sequential Reference System

### Platform-Specific Reference Generation
The platform generates unique sequential references for each donation platform:

```sql
-- Platform-specific sequences for reference generation
CREATE SEQUENCE donation_reference_jg_seq START 1000;  -- JustGiving: PD-JG-1000, PD-JG-1001...
CREATE SEQUENCE donation_reference_ev_seq START 1000;  -- Every.org: PD-EV-1000, PD-EV-1001...

-- Function to generate platform-specific references
CREATE OR REPLACE FUNCTION generate_platform_reference(platform_type donation_platform)
RETURNS TEXT AS $$
DECLARE
  sequence_value INTEGER;
  reference_prefix TEXT;
BEGIN
  CASE platform_type
    WHEN 'justgiving' THEN
      sequence_value := nextval('donation_reference_jg_seq');
      reference_prefix := 'PD-JG-';
    WHEN 'every_org' THEN
      sequence_value := nextval('donation_reference_ev_seq');
      reference_prefix := 'PD-EV-';
    ELSE
      RAISE EXCEPTION 'Unsupported platform type: %', platform_type;
  END CASE;
  
  RETURN reference_prefix || sequence_value::TEXT;
END;
$$ LANGUAGE plpgsql;
```

### Reference Format Examples
- **JustGiving**: `PD-JG-1001`, `PD-JG-1002`, `PD-JG-1003`...
- **Every.org**: `PD-EV-1001`, `PD-EV-1002`, `PD-EV-1003`...

## Data Structures

### Service Location Structure
```typescript
interface ServiceLocation {
  type: 'physical' | 'remote' | 'hybrid'
  address?: string                    // "123 Main St, Sydney NSW"
  area?: string                      // "Sydney CBD", "Melbourne Eastern Suburbs"
  radius?: number                    // km from base location
  travel_fee?: number               // Optional travel cost
  coordinates?: {
    lat: number
    lng: number
  }
}
```

### Contact Info Structure
```typescript
interface ContactInfo {
  phone?: string
  website?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  facebook?: string
}
```

### Service Categories Structure
```typescript
interface ServiceCategories {
  [category: string]: number          // "web_design": 15, "tutoring": 8
}
```

## Service Quality Assurance System

### Core Philosophy
- **Balanced feedback** - Both fundraisers and donors rate each other's experience
- **Happiness-based metrics** - Simple happy/unhappy ratings for all interactions
- **Quality control** - Happiness metrics enable filtering and service access requirements
- **Donor-centric approach** - Maintains charitable giving focus while ensuring quality experiences
- **JustGiving trust** - Only registered charities to ensure legitimacy

### Mutual Feedback System
Both parties provide feedback after each service interaction:
- **Fundraiser rates donor**: "How was your experience with this donor?"
- **Donor rates fundraiser**: "How was your experience with this fundraiser?"
- **Donor rates service**: "How was your experience with this service?"

### Happiness Metrics Calculated

#### Fundraiser Metrics:
- **Received Happiness**: Percentage of donors who rated them 'happy'
- **Sent Happiness**: Percentage of donors this fundraiser rated 'happy'

#### Donor Metrics:
- **Received Happiness**: Percentage of fundraisers who rated them 'happy'
- **Sent Happiness**: Percentage of experiences they rated 'happy'

#### Service Metrics:
- **Happiness Rate**: Percentage of donors who rated the service 'happy'

### Quality-Based Filtering & Access Control

#### Browse Filtering:
- Filter services by minimum happiness rate (e.g., show only 90%+ rated services)
- Filter fundraisers by minimum donor satisfaction
- Filter by fundraiser selectivity (how happy they are with donors)

#### Service Access Requirements:
Fundraisers can set donor requirements for their services:
- Minimum donor reputation (e.g., 85%+ fundraiser satisfaction required)
- Minimum platform experience (e.g., 5+ completed services required)
- Combines with existing charity and capacity requirements

### Service Status Flow

| Donor Response | Fundraiser Response | Final Status | Notes |
|-------------------|-------------------|--------------|-------|
| 😊 **Happy** | *Not Required* | **SUCCESS** | Positive fundraiser experience |
| ⏰ **Timeout** | *Not Required* | **SUCCESS** | No complaints = assume satisfied |
| 😞 **Unhappy** | *Pending* | **FUNDRAISER_REVIEW** | Fundraiser experience issue |
| 😞 **Unhappy** | ✅ **Will Improve** | **ACKNOWLEDGED_FEEDBACK** | Fundraiser accepts feedback |
| 😞 **Unhappy** | ❌ **Disagree** | **DISPUTED_FEEDBACK** | Fundraiser disputes feedback |
| 😞 **Unhappy** | ⏰ **Timeout** | **UNRESPONSIVE_TO_FEEDBACK** | Fundraiser ignored feedback |

## Service Creation & Management

### Service Creation Flow (Platform-Aware)
```typescript
interface ServiceCreation {
  // Basic information
  title: string
  description: string
  
  // Platform selection
  platform: 'justgiving' | 'every_org'  // Inherited from user's preferred_platform
  
  // Fixed donation requirement
  donation_amount: number               // Exact amount (e.g., 50 for $50)
  
  // Platform-specific organization requirements
  charity_requirement_type: 'any_charity' | 'specific_charities'
  preferred_charities: PlatformOrganization[] // Platform-specific organizations
  organization_data: Record<string, any>      // Cached org data for performance
  organization_name: string                   // Cached org name for display
  
  // Availability
  available_from: Date                  // Required start date
  available_until?: Date               // Optional end date
  max_donors?: number                  // Optional capacity limit
  
  // Location options
  service_locations: ServiceLocation[]  // At least one location required
  
  // Donor happiness requirements (optional)
  donor_happiness_requirements?: {
    min_received_happiness?: number      // Donor must be X% liked by fundraisers
    min_total_interactions?: number      // Donor must have X+ completed services
  }
}
```

## Automated Donation Tracking & Notifications

### Donation Status Polling System
The platform uses automated server-side polling to track donation statuses and notify fundraisers:

```typescript
// Edge Function: check-donations (runs every 5 minutes via cron job)
const checkDonationStatuses = async () => {
  // 1. Query pending donations from service_requests
  const pendingDonations = await supabase
    .from('service_requests')
    .select('*')
    .eq('status', 'pending')
    .lt('created_at', timeoutThreshold) // Only check donations older than threshold
  
  // 2. Check status with respective donation platforms
  for (const donation of pendingDonations) {
    if (donation.platform === 'justgiving') {
      const status = await justGivingClient.getDonationByReference(donation.platform_reference)
      if (status.found) {
        await updateDonationStatus(donation, 'success', status.donationId)
        await notifyFundraiser(donation) // Send email notification
      }
    }
    // Similar logic for every_org platform
  }
}
```

### Notification System Architecture
- **Server-Side**: Automated via 5-minute cron job with platform API integration
- **Client-Side**: Real-time dashboard banners for both donors and fundraisers
- **Email Content**: Professional template with donation details, organization info, and next steps
- **History Preservation**: Database relationships maintain donation records with SET NULL behavior

### Dual Confirmation System
- **Primary**: Immediate confirmation via donation success page API call (`/api/donations/confirm`)
- **Backup**: 5-minute cron job handles missed cases (users who don't return to success page)
- **Result**: Zero-delay confirmation + guaranteed processing reliability

## Privacy Implementation

### Core Privacy Principles
- **Always Anonymous**: No public donor names or persistent identities
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to get personal credit
- **Private Connections**: Donor names shared with fundraisers & charities only

### Privacy Data Structures
```typescript
// Public display - always anonymous
interface PublicTransaction {
  amount: number
  charity_name: string
  service_title: string
  created_at: Date
  // No donor information whatsoever
}

// Aggregate statistics - always visible
interface PlatformStats {
  donations_this_month: number
  total_amount_this_month: number
  charities_supported: number
  services_completed: number
  active_providers: number
}

// Optional sharing - user controlled
interface OptionalSharing {
  social_media_share: boolean    // "I donated $50 to Cancer Research via @PoweredByDonation"
  pdf_certificate: boolean       // Downloadable donation certificate
  fundraiser_connection: boolean // Always true - fundraisers can thank donors
  charity_connection: boolean    // Always true - charities can follow up
}
```

## Platform-Specific Organization Pages: Service-Driven Impact Display

### Charity/Nonprofit Page Data Structure (Platform-Aware)
```typescript
interface OrganizationPageData {
  // Basic organization information (platform-specific)
  platform: 'justgiving' | 'every_org'
  organization_id: string               // Platform-specific ID
  name: string
  description: string
  category: string
  logo_url: string
  slug: string                         // SEO-friendly URL slug
  
  // Anonymous aggregate statistics
  stats: {
    total_donations_count: number        // "127 donations received"
    total_amount_received: number        // "$6,350 total raised"
    this_month_count: number            // "23 donations this month"
    this_month_amount: number           // "$1,150 raised this month"
  }
  
  // Service category breakdown
  service_categories: {                 // "Services that supported this organization:"
    [category: string]: number          // "Web Design: 45 donations"
  }                                     // "Tutoring: 23 donations"
  
  // Anonymous recent activity (last 10)
  recent_activity: Array<{
    amount: number                      // "Someone donated $50"
    service_title: string               // "via Web Design service"
    created_at: Date                    // "2 hours ago"
    // NO donor information whatsoever
  }>
}

// Platform-specific URLs:
// JustGiving: /[locale]/justgiving/charity/[slug]
// Every.org:  /[locale]/everyorg/nonprofit/[slug]
```

### Platform Integration (Dual Platform Support)
```typescript
interface PlatformSync {
  // JustGiving Integration
  justgiving: {
    // Periodic sync (daily) to update charity information
    sync_charity_data: () => Promise<void>
    
    // Fetch charity details for new charities
    fetch_charity_info: (charity_id: string) => Promise<CharityData>
    
    // Check donation status by reference
    get_donation_by_reference: (reference: string) => Promise<DonationStatus>
    
    // Generate donation URL with reference tracking
    generate_donation_url: (charity_id: string, amount: number, reference: string) => string
  }
  
  // Every.org Integration (Phase 2)
  every_org: {
    // Periodic sync to update nonprofit information
    sync_nonprofit_data: () => Promise<void>
    
    // Fetch nonprofit details
    fetch_nonprofit_info: (nonprofit_id: string) => Promise<NonprofitData>
    
    // Webhook-based donation confirmation
    handle_donation_webhook: (payload: WebhookPayload) => Promise<void>
  }
  
  // Common utilities
  generate_slug: (organization_name: string) => string
  validate_organization: (platform: Platform, org_id: string) => Promise<boolean>
}
```

### Stats Update Strategy (Platform-Aware)
Statistics are updated in real-time when service requests complete:

```typescript
// When a service request reaches 'success' status (platform-aware)
const updateOrganizationStats = async (service_request: ServiceRequest) => {
  const table_name = service_request.platform === 'justgiving' 
    ? 'justgiving_charity_cache'
    : 'every_org_nonprofit_cache'
    
  await supabase.rpc('increment_organization_stats', {
    table_name,
    organization_id: service_request.organization_id,
    amount: service_request.donation_amount,
    service_category: service_request.service.category
  })
}

// Monthly stats reset (keep historical totals) - platform-aware
const resetMonthlyStats = async () => {
  // Reset JustGiving charity stats
  await supabase
    .from('justgiving_charity_cache')
    .update({
      this_month_count: 0,
      this_month_amount: 0,
      stats_last_updated: new Date()
    })
    
  // Reset Every.org nonprofit stats
  await supabase
    .from('every_org_nonprofit_cache')
    .update({
      this_month_count: 0,
      this_month_amount: 0,
      stats_last_updated: new Date()
    })
}
```

## Email Strategy & Automation

### Mutual Feedback Collection
```typescript
const emailStrategy = {
  // Mutual feedback collection (balanced approach)
  mutualFeedback: {
    timing: "24-48 hours after expected service completion",
    
    // Fundraiser feedback
    fundraiserEmail: {
      subject: "How was your experience with your donor?",
      message: `
        Hi ${fundraiser_name}! A donor donated $${amount} to ${charity} for your ${service_title}.
        
        How was your experience with this donor?
        😊 Happy - responsive and respectful
        😞 Unhappy - had some concerns
        
        This helps us maintain a positive community for everyone.
      `
    },
    
    // Donor feedback  
    donorEmail: {
      subject: "How was your experience with ${fundraiser_name}?",
      message: `
        Hi! Your $${amount} donation to ${charity} helped support ${fundraiser_name}'s service.
        
        How was your experience with this fundraiser?
        😊 Happy with this fundraiser
        😞 Unhappy with this fundraiser
        
        How was the service itself?
        😊 Happy with the service
        😞 Unhappy with the service
        
        Remember: Your donation went to ${charity} regardless - this helps us maintain quality fundraisers.
      `
    },
    
    timeout: "7 days → assume satisfied → mark as SUCCESS"
  }
}
```

## Row Level Security (RLS) Policies

### User Privacy Protection
- Users can only view/edit their own profile data
- Public profiles show only information marked as visible
- Anonymous browsing for all public content

### Service Access Control
- Fundraisers can only manage their own services
- Donors can view all active services
- Service requests link donors and fundraisers appropriately

### Charity Data Protection
- All charity statistics are anonymized
- No personally identifiable donation information exposed
- Aggregate statistics only for public display

---

*This database schema supports the platform's core values of privacy, donor-centricity, and quality service delivery while maintaining scalability and performance.*