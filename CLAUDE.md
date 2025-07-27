# Claude Development Guide - Powered by Donation

## Project Overview

**Powered by Donation** is a donation-service marketplace where service providers offer skills in exchange for charitable donations. Service seekers browse services and make donations to JustGiving charities. We facilitate connections but don't handle payments directly.

### Core Values
- **Australian Legal Compliance**: Privacy Act, Consumer Law, ACNC requirements
- **Social Impact**: Connecting community needs with charitable giving
- **Transparency**: Open operations and community benefit focus
- **Privacy-First**: Anonymous public display with optional personal recognition
- **Donor-Centric**: Focus on charitable giving experience over transactional service delivery

## Business Details

- **Entity**: Individual/Sole Trader - MEHMET AKIF ALTUNDAL
- **ABN**: 17 927 784 658 (Active from 22/07/2025)
- **Location**: NSW, Australia
- **ANZSIC Code**: 5910 - Internet Service Providers And Web Search Portals
- **Email**: contact@poweredbydonation.com
- **Address**: 61 Pimelea Ave, Denham Court NSW 2565

## Development Constraints & Requirements

### Technical Stack (ALWAYS USE THESE)
```
Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
Mobile: React Native (Expo) - Phase 2 (separate repository)
Backend: Supabase (database, auth, edge functions)
Deployment: GitHub → Vercel (automated deployment)
Package Manager: pnpm (NEVER use npm)
SEO: Built-in Next.js SEO + structured data
```

### Budget Constraints
- **Monthly Budget**: ~$60/month for tools
- **Development**: Solo development with Claude assistance
- **Infrastructure**: Vercel (free tier initially), Supabase (free tier)

### Compliance Requirements

#### Australian Legal Requirements
- **Privacy**: Australian Privacy Act 1988 compliance
- **Consumer Protection**: Australian Consumer Law compliance
- **Data**: Minimal collection, user consent, right to deletion
- **Fundraising**: NSW Charitable Fundraising Act (if >$15K)

#### Business Progression
- **Current**: Sole Trader (ABN registered)
- **12-18 months**: Transition to Not-for-Profit
- **18-24 months**: ACNC Charity Registration with DGR status

## Project Structure

```
powered-by-donation/                          # 🚀 Single GitHub Repository
├── src/                                      # Next.js 14 App Router source
├── public/                                   # Static assets
├── supabase/                                 # Backend & Database
├── __tests__/                                # Testing
├── .github/                                  # CI/CD
├── docs/                                     # Documentation
├── package.json                              # Project dependencies
├── next.config.js                            # Next.js configuration
├── tailwind.config.js                        # Tailwind CSS config
├── tsconfig.json                             # TypeScript config
└── .env.example                              # Environment variables
```

## Component Splitting Guide

### Core Philosophy
**Split by pain, not by rules.** Create new components when existing ones become difficult to work with, not because they hit arbitrary line limits.

### When to Split Components

#### Split When:
- **Logic complexity increases** - Multiple useEffect hooks or complex state management
- **Reusability emerges** - Same UI pattern used in 3+ places
- **Testing becomes difficult** - Hard to isolate what you're testing
- **Bug hunting is painful** - Can't quickly find where issues originate
- **Multiple developers need to work on same area** - Reduces merge conflicts

#### Don't Split When:
- **Simple display logic** - Basic JSX doesn't need its own component
- **Tightly coupled UI** - Form fields that work together should stay together
- **One-off components** - Not everything needs to be reusable
- **Just hit a line count** - 100 lines of simple JSX is fine

### Practical Splitting Strategy

#### Level 1: Page Components (100-200 lines)
Main page orchestrates major sections and handles routing concerns

#### Level 2: Section Components (50-100 lines)
Split by logical UI sections - header, content, sidebar areas

#### Level 3: Feature Components (20-50 lines)
Split when feature has complex logic or high reusability

### File Organization Rules

#### By Feature, Not by Type
Organize components by business feature rather than technical type

#### Logical Grouping:
- **Pages**: Main route components (100-200 lines)
- **Sections**: Major UI areas (50-100 lines)  
- **Features**: Reusable business logic (20-50 lines)
- **UI**: Generic interface elements (10-30 lines)

### Custom Hooks Strategy

#### Extract Logic, Keep UI Together
Move complex logic to custom hooks while keeping related UI elements in the same component

### Complexity Indicators

#### Red Flags to Split:
- **Multiple concerns** - Component handles display AND logic AND state management
- **Prop drilling** - Passing props through 3+ component layers
- **Hard to test** - Need complex mocks to test simple functionality
- **Git conflicts** - Multiple developers editing same large file
- **Copy-paste urges** - Wanting to duplicate part of a component elsewhere

#### Green Flags to Keep Together:
- **Single responsibility** - Component does one thing well
- **Cohesive UI** - Elements that always appear together
- **Simple logic** - Straightforward display or interaction
- **Easy testing** - Can test functionality with simple props

### Practical Guidelines

#### Component Size Targets:
- **Pages**: 100-200 lines (orchestration)
- **Sections**: 50-100 lines (major UI areas)
- **Features**: 20-50 lines (business logic)
- **UI Components**: 10-30 lines (generic elements)

#### Refactoring Triggers:
- **"Where is X?"** - Can't quickly find functionality
- **"This is doing too much"** - Multiple unrelated responsibilities
- **"I need just this part"** - Want to reuse portion of component
- **"Tests are complex"** - Need elaborate setup for simple assertions

### Development Workflow

#### Start Simple, Split When Needed:
1. **Build feature in one component** - Get it working first
2. **Identify pain points** - Where does editing become difficult?
3. **Extract by logical boundaries** - Split by feature, not lines
4. **Test the split** - Ensure functionality still works
5. **Refactor imports** - Update related components

#### Review Checklist:
- Can I understand this component in under 30 seconds?
- Can I test this component without complex setup?
- Would a new developer know where to make changes?
- Are related UI elements kept together?
- Is complex logic extracted to hooks?

### Anti-Patterns to Avoid

#### Over-Splitting:
Avoid creating wrapper components that add no value or breaking simple UI into unnecessary hierarchies

#### Under-Splitting:
Avoid monolithic components that handle multiple unrelated concerns in hundreds of lines

## Privacy Model: Anonymous + Aggregate + Optional Sharing

### Core Privacy Principles
- **Always Anonymous**: No public donor names or persistent identities
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to get personal credit
- **Private Connections**: Donor names shared with providers & charities only

### Privacy Implementation
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

## Database Schema: Simple MVP Approach

### Core Entity Tables
```sql
-- Providers with basic privacy controls
CREATE TABLE providers (
  id UUID PRIMARY KEY,
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
  id UUID PRIMARY KEY,
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
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES providers(id),
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service request tracking with satisfaction feedback
CREATE TABLE service_requests (
  id UUID PRIMARY KEY,
  supporter_id UUID REFERENCES supporters(id),
  provider_id UUID REFERENCES providers(id),
  service_id UUID REFERENCES services(id),
  justgiving_charity_id TEXT NOT NULL,
  donation_amount DECIMAL NOT NULL,       -- Fixed amount from service
  charity_name TEXT,
  
  -- Status and feedback tracking
  status service_status DEFAULT 'pending',
  supporter_satisfaction TEXT, -- 'happy', 'unhappy', 'timeout'
  provider_feedback_response TEXT, -- 'will_improve', 'disagree', 'timeout'
  
  -- Timing for follow-ups
  satisfaction_check_sent_at TIMESTAMP,
  supporter_responded_at TIMESTAMP,
  provider_feedback_sent_at TIMESTAMP,
  provider_responded_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enums
CREATE TYPE charity_requirement_enum AS ENUM (
  'any_charity',        -- "Donate to any JustGiving charity"
  'specific_charities'  -- "Donate to one of my preferred charities"
);

CREATE TYPE service_status AS ENUM (
  'pending',                    -- Donation made, provider notified
  'success',                    -- Supporter happy or timeout (positive outcome)
  'provider_review',            -- Supporter unhappy, waiting for provider response
  'acknowledged_feedback',      -- Provider accepts feedback
  'disputed_feedback',          -- Provider disputes feedback
  'unresponsive_to_feedback'    -- Provider ignored feedback
);

-- Charity information cache
CREATE TABLE charity_cache (
  justgiving_charity_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  logo_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

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

## Service Quality Assurance: Donor-Centric Feedback

### Core Philosophy
- **Donors first, customers second** - Users are charitable donors who receive services as a bonus
- **Provider experience focus** - "Are you happy with this provider?" not "Did you receive service?"
- **Quality community** - Maintain high-quality providers through gentle feedback system
- **JustGiving trust** - Only registered charities to ensure legitimacy

### Service Status Flow

| Supporter Response | Provider Response | Final Status | Notes |
|-------------------|-------------------|--------------|-------|
| 😊 **Happy** | *Not Required* | **SUCCESS** | Positive provider experience |
| ⏰ **Timeout** | *Not Required* | **SUCCESS** | No complaints = assume satisfied |
| 😞 **Unhappy** | *Pending* | **PROVIDER_REVIEW** | Provider experience issue |
| 😞 **Unhappy** | ✅ **Will Improve** | **ACKNOWLEDGED_FEEDBACK** | Provider accepts feedback |
| 😞 **Unhappy** | ❌ **Disagree** | **DISPUTED_FEEDBACK** | Provider disputes feedback |
| 😞 **Unhappy** | ⏰ **Timeout** | **UNRESPONSIVE_TO_FEEDBACK** | Provider ignored feedback |

### Email Strategy
```typescript
const emailStrategy = {
  // Supporter satisfaction check (donor-friendly language)
  supporterSatisfaction: {
    timing: "24-48 hours after expected service completion",
    subject: "How was your experience with [Provider Name]?",
    message: `
      Hi! Your $${donation_amount} donation to ${charity} helped support ${provider}'s service.
      
      How was your experience with this provider?
      😊 Happy with this provider
      😞 Not satisfied with this provider
      
      Remember: Your donation went to ${charity} regardless - this helps us maintain quality providers.
    `,
    timeout: "7 days → assume satisfied → mark as SUCCESS"
  },

  // Provider feedback (only when supporter unhappy)
  providerFeedback: {
    trigger: "supporter_unhappy",
    subject: "Supporter feedback on your recent service",
    message: `
      A supporter who donated $${donation_amount} for your service wasn't fully satisfied.
      This is feedback to help improve our community.
      
      Please respond within 48 hours:
      ✅ Thank you for the feedback, I'll improve
      ❌ I believe I provided good service
    `,
    timeout: "48 hours → mark as UNRESPONSIVE_TO_FEEDBACK"
  }
}
```

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
}
```

## SEO Strategy (CRITICAL)

### Page Structure for Maximum SEO
- **Services**: `/services/[slug]` - Individual service pages (SSG)
- **Categories**: `/services/category/[category]` - Service category landing pages
- **Locations**: `/services/location/[location]` - Location-based services
- **Providers**: `/provider/[slug]` - Provider profile pages
- **Supporters**: `/supporter/[slug]` - Supporter profile pages
- **Browse**: `/browse` - Main browsing page with filters
- **Search**: `/search?category=X&location=Y&amount=Z` - Filtered search results

### SEO Implementation Requirements
- Static Site Generation (SSG) for all service/provider pages
- Dynamic sitemap generation
- Structured data (Schema.org) for services and providers
- Meta tags and Open Graph optimization
- Fast loading (Core Web Vitals optimization)

## User Experience: Fixed Layouts & Consistent Design

### Design Philosophy
- **Consistent page structures** - Same layout for all providers/services/locations
- **Simple privacy controls** - Show/hide toggles for basic sections only
- **No user customization** - Users see identical, optimized layouts
- **Developer modularity** - Easy to add entities/properties behind the scenes
- **Mobile-first** - Responsive design with consistent patterns

### User Flow
#### Anonymous Browsing
1. **Browse freely** - No signup required to view services/categories/providers
2. **Search and filter** - Find services by category, location, donation amount
3. **View service details** - See provider info, fixed donation amount, charity requirements
4. **See anonymous activity** - "Someone donated $50 to Cancer Research"

#### Provider Journey
1. **Sign up to post** - Required when creating services
2. **Create services** - Set fixed donation amount, select charity requirements, define availability
3. **Manage capacity** - Set maximum supporters if needed
4. **Define locations** - Physical, remote, or hybrid service delivery
5. **Receive donations** - Get notified when supporters donate for services
6. **Connect with supporters** - Access to donor names for thank you messages
7. **Receive feedback** - Gentle feedback system to maintain quality

#### Supporter Journey
1. **Browse services** - Find services to support with clear pricing
2. **View fixed pricing** - See exactly how much donation is required
3. **Choose charity** - Either any charity or from provider's preferred list
4. **Sign up to donate** - Required for donation tracking and provider connection
5. **Donate via JustGiving** - External payment processing to registered charities
6. **Return with confirmation** - Platform tracks donation for provider connection
7. **Provider satisfaction** - Share experience about provider quality
8. **Optional sharing** - Social media posts or downloadable certificates

## Brand Guidelines

### Logo & Identity
- **Primary**: "PD" (text-based logo)
- **Secondary**: "Powered by Donation" (full name)
- **Font**: System fonts only (system-ui, -apple-system, sans-serif)
- **Approach**: Minimalist, accessibility-first, SEO-optimized

### Design Philosophy
- Clean, professional appearance
- Fast loading (no external font dependencies)
- Responsive design
- Accessibility compliance (WCAG 2.1)
- Consistent layouts across all entity types
- Charitable giving aesthetic (warm, trustworthy, community-focused)
- Clear pricing display (fixed amounts prominently shown)

## Development Timeline

### Phase 1: MVP Development (Weeks 1-8)
- **Week 1**: Next.js foundation + SEO setup + anonymous privacy model
- **Week 2**: Service marketplace + fixed pricing system + charity requirements
- **Week 3**: Availability and capacity management + location options
- **Week 4**: JustGiving integration + anonymous donation display
- **Week 5**: Provider-supporter connections + satisfaction feedback system
- **Week 6**: Social sharing features + reputation system
- **Week 7**: Email automation + service status tracking
- **Week 8**: Testing, optimization, production deployment

### Phase 2: Not-for-Profit Transition (Weeks 9-16)
- Legal structure transition
- Mobile app development (React Native - separate repository)
- Enhanced analytics and reporting
- Grant applications

### Phase 3: Charity Registration (Weeks 17-24)
- ACNC charity application
- Platform scaling and optimization
- Major funding applications
- Community growth initiatives

## Key Commands & Practices

### Package Management
```bash
# ALWAYS use pnpm, never npm
pnpm install
pnpm add package-name
pnpm run dev
pnpm run build
```

### Database Migrations
```bash
# Supabase migrations
supabase migration new migration_name
supabase db push
supabase gen types typescript --local > types/database.ts
```

### Deployment
```bash
# GitHub push triggers automatic Vercel deployment
git add .
git commit -m "feature: description"
git push origin main

# Environment variables managed via Vercel dashboard
# No manual deployment commands needed
```

## Important Notes for Claude

### Always Remember
1. **pnpm only** - Never suggest npm commands
2. **SEO first** - Every page needs proper meta tags and structured data  
3. **Anonymous always** - No public donor names, identities, or tracking
4. **Aggregate statistics** - Show platform activity in totals only
5. **Fixed pricing** - Services have exact donation amounts, not minimum or variable
6. **Fixed layouts** - Consistent user experience, no customization
7. **Simple schema** - Basic privacy toggles, no complex modularity
8. **Donor-centric language** - Focus on charitable giving, not transactional service
9. **JustGiving only** - Only registered charities allowed
10. **Charity requirements** - Either "any charity" or "specific charities" options
11. **Availability management** - Services have date ranges and optional capacity limits
12. **Location flexibility** - Physical, remote, or hybrid service delivery options
13. **Satisfaction feedback** - "Happy with provider?" not "Did you receive service?"
14. **Optional sharing** - Users control when they get recognition
15. **Component splitting** - Split by pain, not by rules
16. **Logical grouping** - Organize by feature, not by type
17. **Australian law** - Consider privacy and consumer protection
18. **No payment processing** - We only facilitate, JustGiving handles payments
19. **GitHub deployment** - All code changes via Git push, not manual deployment

### Never Suggest
- Public donor names, persistent anonymous identities, or user tracking
- Variable or minimum donation amounts (always fixed)
- Complex privacy controls or user customization options
- Transactional language (avoid "purchase", "customer", "refund")
- Over-splitting components into unnecessary micro-components
- Payment processing on our platform
- External font loading (performance impact)
- Complex authentication beyond Supabase
- Manual deployment commands (use Git push instead)
- Non-JustGiving charities

### Always Suggest
- Anonymous public displays ("Someone donated $X")
- Aggregate statistics ("47 donations this month")
- Fixed donation amounts prominently displayed
- Clear charity requirement indicators
- Donor-centric language ("supporters", "donations", "community impact")
- Satisfaction-based feedback ("Are you happy with this provider?")
- Service availability and capacity indicators
- Location-based service options
- Component splitting by logical boundaries, not arbitrary rules
- Custom hooks for complex logic extraction
- Optional social sharing features
- Fixed, consistent page layouts
- Simple show/hide privacy controls
- Static generation for better SEO
- Structured data for rich snippets
- Performance optimizations
- Accessibility improvements

## Contact & Support

- **Primary Contact**: MEHMET AKIF ALTUNDAL
- **Email**: contact@poweredbydonation.com
- **Development Environment**: Claude AI assistance
- **Repository**: GitHub (automated deployment to Vercel)
- **Deployment**: Automatic via GitHub push

---

*This guide should be referenced in every development session to ensure consistency with project goals, privacy principles, fixed pricing model, donor-centric approach, component architecture, and technical requirements.*