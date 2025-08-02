# Database Schema & Architecture - Powered by Donation

## Overview

The platform uses a unified user system with Supabase PostgreSQL database, supporting both provider and supporter roles through a single `users` table. This design simplifies authentication, reduces complexity, and enables seamless role switching.

## Core Entity Tables

### Users Table (Unified System)
```sql
-- Unified users table replacing providers and supporters
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
  is_provider BOOLEAN DEFAULT false,
  is_supporter BOOLEAN DEFAULT false,
  
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

### Services Table
```sql
-- Services with availability, capacity, and charity requirements
CREATE TABLE services (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Fixed donation amount requirement
  donation_amount DECIMAL NOT NULL,        -- Exact amount required (e.g., $50)
  
  -- Charity requirements
  charity_requirement_type charity_requirement_enum NOT NULL,
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
  
  -- Quality metrics
  happiness_rate INTEGER DEFAULT 0,       -- % supporter satisfaction for this service
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Service Requests Table
```sql
-- Service request tracking with satisfaction feedback
CREATE TABLE service_requests (
  id UUID PRIMARY KEY,
  supporter_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  justgiving_charity_id TEXT NOT NULL,
  donation_amount DECIMAL NOT NULL,       -- Fixed amount from service
  charity_name TEXT,
  
  -- Status and feedback tracking
  status service_status DEFAULT 'pending',
  supporter_satisfaction TEXT,            -- 'happy', 'unhappy', 'timeout'
  provider_feedback_response TEXT,        -- 'will_improve', 'disagree', 'timeout'
  
  -- Mutual feedback system
  provider_rates_supporter TEXT,          -- 'happy', 'unhappy', null
  supporter_rates_provider TEXT,          -- 'happy', 'unhappy', null  
  supporter_rates_service TEXT,           -- 'happy', 'unhappy', null
  
  -- Timing for follow-ups
  satisfaction_check_sent_at TIMESTAMP,
  supporter_responded_at TIMESTAMP,
  provider_feedback_sent_at TIMESTAMP,
  provider_responded_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Charity Cache Table
```sql
-- Charity information cache with stats tracking
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
```

## Enums & Types

### Charity Requirement Types
```sql
CREATE TYPE charity_requirement_enum AS ENUM (
  'any_charity',        -- "Donate to any JustGiving charity"
  'specific_charities'  -- "Donate to one of my preferred charities"
);
```

### Service Status Flow
```sql
CREATE TYPE service_status AS ENUM (
  'pending',                    -- Donation made, provider notified
  'success',                    -- Supporter happy or timeout (positive outcome)
  'provider_review',            -- Supporter unhappy, waiting for provider response
  'acknowledged_feedback',      -- Provider accepts feedback
  'disputed_feedback',          -- Provider disputes feedback
  'unresponsive_to_feedback'    -- Provider ignored feedback
);
```

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
- **Balanced feedback** - Both providers and supporters rate each other's experience
- **Happiness-based metrics** - Simple happy/unhappy ratings for all interactions
- **Quality control** - Happiness metrics enable filtering and service access requirements
- **Donor-centric approach** - Maintains charitable giving focus while ensuring quality experiences
- **JustGiving trust** - Only registered charities to ensure legitimacy

### Mutual Feedback System
Both parties provide feedback after each service interaction:
- **Provider rates supporter**: "How was your experience with this supporter?"
- **Supporter rates provider**: "How was your experience with this provider?"
- **Supporter rates service**: "How was your experience with this service?"

### Happiness Metrics Calculated

#### Provider Metrics:
- **Received Happiness**: Percentage of supporters who rated them 'happy'
- **Sent Happiness**: Percentage of supporters this provider rated 'happy'

#### Supporter Metrics:
- **Received Happiness**: Percentage of providers who rated them 'happy'
- **Sent Happiness**: Percentage of experiences they rated 'happy'

#### Service Metrics:
- **Happiness Rate**: Percentage of supporters who rated the service 'happy'

### Quality-Based Filtering & Access Control

#### Browse Filtering:
- Filter services by minimum happiness rate (e.g., show only 90%+ rated services)
- Filter providers by minimum supporter satisfaction
- Filter by provider selectivity (how happy they are with supporters)

#### Service Access Requirements:
Providers can set supporter requirements for their services:
- Minimum supporter reputation (e.g., 85%+ provider satisfaction required)
- Minimum platform experience (e.g., 5+ completed services required)
- Combines with existing charity and capacity requirements

### Service Status Flow

| Supporter Response | Provider Response | Final Status | Notes |
|-------------------|-------------------|--------------|-------|
| 😊 **Happy** | *Not Required* | **SUCCESS** | Positive provider experience |
| ⏰ **Timeout** | *Not Required* | **SUCCESS** | No complaints = assume satisfied |
| 😞 **Unhappy** | *Pending* | **PROVIDER_REVIEW** | Provider experience issue |
| 😞 **Unhappy** | ✅ **Will Improve** | **ACKNOWLEDGED_FEEDBACK** | Provider accepts feedback |
| 😞 **Unhappy** | ❌ **Disagree** | **DISPUTED_FEEDBACK** | Provider disputes feedback |
| 😞 **Unhappy** | ⏰ **Timeout** | **UNRESPONSIVE_TO_FEEDBACK** | Provider ignored feedback |

## Service Creation & Management

### Service Creation Flow
```typescript
interface ServiceCreation {
  // Basic information
  title: string
  description: string
  
  // Fixed donation requirement
  donation_amount: number              // Exact amount (e.g., 50 for $50)
  
  // Charity requirements
  charity_requirement_type: 'any_charity' | 'specific_charities'
  preferred_charities: JustGivingCharity[] // Only for specific_charities
  
  // Availability
  available_from: Date                 // Required start date
  available_until?: Date              // Optional end date
  max_supporters?: number             // Optional capacity limit
  
  // Location options
  service_locations: ServiceLocation[] // At least one location required
  
  // Supporter happiness requirements (optional)
  supporter_happiness_requirements?: {
    min_received_happiness?: number     // Supporter must be X% liked by providers
    min_total_interactions?: number     // Supporter must have X+ completed services
  }
}
```

## Privacy Implementation

### Core Privacy Principles
- **Always Anonymous**: No public donor names or persistent identities
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to get personal credit
- **Private Connections**: Donor names shared with providers & charities only

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
  provider_connection: boolean   // Always true - providers can thank donors
  charity_connection: boolean    // Always true - charities can follow up
}
```

## Charity Pages: Service-Driven Impact Display

### Charity Page Data Structure
```typescript
interface CharityPageData {
  // Basic charity information (from JustGiving API)
  justgiving_charity_id: string
  name: string
  description: string
  category: string
  logo_url: string
  
  // Anonymous aggregate statistics
  stats: {
    total_donations_count: number        // "127 donations received"
    total_amount_received: number        // "$6,350 total raised"
    this_month_count: number            // "23 donations this month"
    this_month_amount: number           // "$1,150 raised this month"
  }
  
  // Service category breakdown
  service_categories: {                 // "Services that supported this charity:"
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
```

### JustGiving Integration
```typescript
interface JustGivingSync {
  // Periodic sync (daily) to update charity information
  sync_charity_data: () => Promise<void>
  
  // Fetch charity details for new charities
  fetch_charity_info: (charity_id: string) => Promise<CharityData>
  
  // Generate SEO-friendly slug from charity name
  generate_slug: (charity_name: string) => string
  
  // Validate charity exists and is active
  validate_charity: (charity_id: string) => Promise<boolean>
}
```

### Stats Update Strategy
Statistics are updated in real-time when service requests complete:

```typescript
// When a service request reaches 'success' status
const updateCharityStats = async (service_request: ServiceRequest) => {
  await supabase.rpc('increment_charity_stats', {
    charity_id: service_request.justgiving_charity_id,
    amount: service_request.donation_amount,
    service_category: service_request.service.category
  })
}

// Monthly stats reset (keep historical totals)
const resetMonthlyStats = async () => {
  await supabase
    .from('charity_cache')
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
    
    // Provider feedback
    providerEmail: {
      subject: "How was your experience with your supporter?",
      message: `
        Hi ${provider_name}! A supporter donated $${amount} to ${charity} for your ${service_title}.
        
        How was your experience with this supporter?
        😊 Happy - responsive and respectful
        😞 Unhappy - had some concerns
        
        This helps us maintain a positive community for everyone.
      `
    },
    
    // Supporter feedback  
    supporterEmail: {
      subject: "How was your experience with ${provider_name}?",
      message: `
        Hi! Your $${amount} donation to ${charity} helped support ${provider_name}'s service.
        
        How was your experience with this provider?
        😊 Happy with this provider
        😞 Unhappy with this provider
        
        How was the service itself?
        😊 Happy with the service
        😞 Unhappy with the service
        
        Remember: Your donation went to ${charity} regardless - this helps us maintain quality providers.
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
- Providers can only manage their own services
- Supporters can view all active services
- Service requests link supporters and providers appropriately

### Charity Data Protection
- All charity statistics are anonymized
- No personally identifiable donation information exposed
- Aggregate statistics only for public display

---

*This database schema supports the platform's core values of privacy, donor-centricity, and quality service delivery while maintaining scalability and performance.*