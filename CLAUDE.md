# Claude Development Guide - Powered by Donation

## Project Overview

**Powered by Donation** is a donation-service marketplace where fundraisers offer skills in exchange for charitable donations. Donors browse services and make donations to JustGiving charities. We facilitate connections but don't handle payments directly.

### Core Values
- **Australian Legal Compliance**: Privacy Act, Consumer Law, ACNC requirements
- **Social Impact**: Connecting community needs with charitable giving
- **Privacy-First**: Anonymous public display with optional personal recognition
- **Donor-Centric**: Focus on charitable giving experience over transactional service delivery

## Business Details
- **Entity**: Individual/Sole Trader - MEHMET AKIF ALTUNDAL
- **ABN**: 17 927 784 658 (Active from 22/07/2025)
- **Email**: contact@poweredbydonation.com
- **Location**: NSW, Australia

## Technical Stack (ALWAYS USE THESE)
```
Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + next-intl
Backend: Supabase (database, auth, edge functions)
Deployment: GitHub → Vercel (automated deployment)
Package Manager: pnpm (NEVER use npm)
Internationalization: next-intl with 17 language support
```

## Essential Claude Guidelines

### Core Principles
1. **pnpm only** - Never suggest npm commands
2. **Anonymous always** - No public donor names, identities, or tracking  
3. **Fixed pricing** - Services have exact donation amounts (never minimum/variable)
4. **Unified user system** - Single users table for both fundraiser and donor roles
5. **Donor-centric language** - Focus on charitable giving, not transactions
6. **Multi-Platform Architecture** - Scalable platform integration with platform-first architecture
7. **Component splitting** - Split by pain, not by arbitrary rules
8. **Translation keys** - Use next-intl for all user-facing text
9. **Australian compliance** - Privacy Act, Consumer Law considerations
10. **GitHub deployment** - All changes via Git push, not manual commands
11. **Performance first** - Server-side filtering, pagination, strategic indexing
12. **Dynamic over static** - When pages need any dynamic behavior (even potential future dynamic features), it's safer to use `export const dynamic = 'force-dynamic'` rather than trying to optimize with static generation that can cause production conflicts

### Key Patterns
- **Anonymous displays**: "Someone donated $50 via Web Design service"
- **Aggregate statistics**: "47 donations this month" 
- **Fixed layouts**: Consistent page structures, no user customization
- **Quality feedback**: "Happy with fundraiser?" not "Did you receive service?"
- **Charity requirements**: Either "any charity" or "specific charities"
- **Platform-first URLs**: `/{locale}/{platform}/charities/{slug}` structure
- **Context-driven actions**: Create services and donations from charity/service pages

### Privacy Model: Anonymous + Aggregate + Optional Sharing
- **Always Anonymous**: No public donor names or persistent identities
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to get personal credit
- **Private Connections**: Donor names shared with fundraisers & charities only

## Component Architecture
**Split by pain, not by rules.** Create new components when existing ones become difficult to work with, not because they hit arbitrary line limits.

#### Component Size Targets:
- **Pages**: 100-200 lines (orchestration)
- **Sections**: 50-100 lines (major UI areas)
- **Features**: 20-50 lines (business logic)
- **UI Components**: 10-30 lines (generic elements)

## User Journeys

### Platform-First Navigation
Users navigate platform-first: `/{locale}/justgiving/` or `/{locale}/everyorg/` → explore charities/services within platform context.

#### Anonymous Browsing
Browse any platform freely → view charities and services → context-driven donations without signup required.

#### Context-Driven Service Creation
Browse platform charities → find interesting charity → click "Create Service for [Charity]" → service form pre-filled with platform + charity context.

#### Natural Donation Flow  
Browse services → view fixed pricing → click donate → donation processed via service's designated platform (JustGiving/Every.org).

#### Cross-Platform Freedom
Users can freely switch between `/justgiving/` and `/everyorg/` - no platform restrictions or "preferences" to manage.

## Development Workflow
- **Database**: See `supabase/CLAUDE.md` for schema, migrations, and Supabase-specific guidelines
- **Frontend**: See `src/CLAUDE.md` for component patterns, internationalization, and UI development
- **Documentation**: Updated README files in root contain detailed implementation guides

## Current Status
**Completed**: Provider→Fundraiser & Supporter→Donor terminology rename (100% complete)
**Completed**: M11 - Browse Charities System with enhanced charity data fetching  
**Completed**: Performance optimization with server-side filtering, pagination, and city-based filtering
**Completed**: M12 (Phase 2 Every.org Integration) - Foundation Complete
**Completed**: Platform-First URL Restructuring - Core Architecture Complete (57% - 17/30 tasks)
  - ✅ Database foundation with unified `organization_cache` table
  - ✅ Complete platform-first routing system with localized URLs
  - ✅ Full organization browsing components and pages
  - ✅ Homepage integration with platform awareness and correct Every.org counts
  - ✅ MultilingualNavbar added to all platform-specific pages
**Completed**: Multi-Platform Service Creation System 
  - ✅ Hierarchical platform → organization selection system
  - ✅ Advanced UI with Select All/Clear All functionality at all levels
  - ✅ Full platform requirements validation and database integration
  - ✅ Legacy system replaced with modern multi-platform architecture
**Completed**: Platform Requirements UI/UX Enhancement - Mobile-first design and advanced selection features

### Major Architecture Project: Platform-First Restructuring

#### Project Goal
Transform entire application from entity-first to platform-first architecture with context-driven user actions and cross-platform freedom.

#### New URL Structure
```
/{locale}/                                    # Site welcome
/{locale}/services/                           # Browse all services (location + platform + category filtered)
/{locale}/services/[slug]/                    # Individual service + donation flow
/{locale}/[platform]/                         # Platform home (justgiving/everyorg)  
/{locale}/[platform]/[entity_type]/          # Browse organizations (charities/nonprofits)
/{locale}/[platform]/[entity_type]/[slug]/   # Individual organization + context actions
```

#### Key Changes
- **Platform-Agnostic Services**: Services remain at `/{locale}/services` with platform + location + category filtering
- **Platform-Specific Organizations**: Organizations grouped by platform with localized entity types
- **Unified Data**: Single `organization_cache` table for all platforms with simple field names
- **Context Actions**: Create services directly from organization pages
- **Cross-Platform Freedom**: Users can switch between platforms freely
- **Localized Terminology**: entity_type translates (charities→bağışçılar, nonprofits→kar-amacı-gütmeyen)
- **Enhanced Filtering**: Services can be filtered by location (online/cities), platform, and category

#### Uniform Platform Naming Convention
**Standard**: Letters-only, no separators (-, _, .)
- **URLs**: `/justgiving/` and `/everyorg/`
- **Database**: `'justgiving'` and `'everyorg'`  
- **Edge Functions**: `justgiving_action` and `everyorg_action`
- **API Endpoints**: `/api/justgiving/*` and `/api/everyorg/*`
- **Tables**: `justgiving_charity_cache` and `everyorg_nonprofit_cache`
- **Display Names**: "JustGiving" and "Every.org" (branding preserved)

#### Edge Function Reorganization
**Platform-First Naming**: `{platform}_{action}_{entity?}`
- `justgiving_create_donation_link`
- `justgiving_poll_donation_confirmation`
- `justgiving_populate_cache`
- `justgiving_fetch_enhanced_details`
- `everyorg_create_donation_link`
- `everyorg_poll_donation_confirmation`
- `everyorg_populate_cache`
- `everyorg_validate_webhook`

#### Implementation Progress (30 Tasks Total)

**Phase 1: Database Foundation (Tasks 1-4) - COMPLETED ✅**
1. ✅ Database: Create unified organization_cache table migration
2. ✅ Database: Migrate existing charity data from platform-specific tables  
3. ✅ Database: Update TypeScript types for new organization_cache schema
4. ✅ Database: Create indexes for performance (platform, slug, location, category)

**Phase 2: Routing Infrastructure (Tasks 5-7) - COMPLETED ✅**
5. ✅ Routing: Implement dynamic [platform] route structure
6. ✅ Routing: Create [entity_type] dynamic routing (charities/nonprofits) 
7. ✅ Routing: Update existing organization [slug] pages to use new structure

**Phase 3: Services Enhancement (Tasks 8-10) - COMPLETED ✅**
8. ✅ Services: Add platform filter to services browse page
9. ✅ Services: Add location filter with online/city options (already implemented)
10. ✅ Services: Update service filtering logic for new filters

**Phase 4: Internationalization (Tasks 11-12) - COMPLETED ✅**
11. ✅ i18n: Create entity type translations (charities→bağışçılar, nonprofits→kar-amacı-gütmeyen)
12. ✅ i18n: Add platform-specific terminology translations

**Phase 5: Page Implementation (Tasks 13-15) - COMPLETED ✅**
13. ✅ Pages: Build platform home pages (/[locale]/[platform]/)
14. ✅ Pages: Create organization browse pages (/[locale]/[platform]/[entity_type]/)
15. ✅ Pages: Update individual organization pages with new URL structure

**Phase 6: Component Development (Tasks 16-18) - COMPLETED ✅**
16. ✅ Components: Create PlatformSelector component for services filtering
17. ✅ Components: Create LocationFilter component (online/cities)
18. ✅ Components: Add 'Create Service for [Organization]' buttons to org pages

**Phase 7: Navigation Updates (Tasks 19-20) - COMPLETED ✅**
19. ✅ Navigation: Update main navigation for platform/services separation
20. ✅ Navigation: Update all internal links to new URL structure

**Phase 8: API Integration (Tasks 21-24) - COMPLETED ✅**
21. ✅ API: Update organization fetching APIs for unified table
22. ✅ API: Create platform-specific organization endpoints
23. ✅ Edge Functions: Update charity cache population for unified table
24. ✅ Edge Functions: Update Every.org cache population for unified table

**Phase 9: Feature Integration (Task 25) - COMPLETED ✅**
25. ✅ Service Creation: Update service creation form with context from org pages + Added platform_requirements column migration

**Phase 10: Cleanup & Testing (Tasks 26-30)**
26. ⏳ Cleanup: Remove old platform-specific charity cache tables
27. ⏳ Cleanup: Remove legacy browse routes and components
28. ⏳ Testing: Test all new routes and URL structures
29. ⏳ Testing: Test service filtering with new platform/location filters
30. ⏳ Testing: Test context-driven service creation flow

#### Major Milestone: Core Platform-First Architecture Complete ✅

**COMPLETED (25/30 Tasks - 83% Complete):**
- **Database Foundation**: Unified `organization_cache` table with all existing data migrated
- **URL Structure**: Complete platform-first routing with transliterated entity types  
- **Services Enhancement**: Platform and location filtering with live counts and filter summaries
- **Internationalization**: Platform-specific entity translations and localized services URLs
- **Navigation Updates**: Localized services paths (en/services → tr/hizmetler) and navigation links
- **Components**: Full organization browsing, filtering, and display system
- **Homepage Integration**: Platform-aware homepage with real-time statistics
- **API Integration**: All endpoints use unified organization_cache table with platform-specific filtering
- **Service Creation**: Every.org integration working with new platform_requirements system

**New URL Structure (LIVE):**
```
/{locale}/                                    # Site welcome - UPDATED ✅
/{locale}/services/                           # Browse all services (existing)
/{locale}/services/[slug]/                    # Individual service (existing)  
/{locale}/justgiving/                         # JustGiving platform home - NEW ✅
/{locale}/everyorg/                          # Every.org platform home - NEW ✅
/{locale}/justgiving/charities/              # Browse JustGiving charities - NEW ✅
/{locale}/everyorg/nonprofits/               # Browse Every.org nonprofits - NEW ✅
/{locale}/justgiving/charities/[slug]/       # Individual charity page - NEW ✅
/{locale}/everyorg/nonprofits/[slug]/        # Individual nonprofit page - NEW ✅
```

**Localized URLs (17 Languages):**
- **Organization URLs**: `/en/justgiving/charities/` → `/tr/justgiving/bagis-kuruluslari/`
- **Organization URLs**: `/en/everyorg/nonprofits/` → `/tr/everyorg/kar-amaci-gutmeyen-kuruluslar/`
- **Services URLs**: `/en/services/` → `/tr/hizmetler/` (NEW ✅)

**Services Localization (17 Languages):**
- English: `/services` → Turkish: `/hizmetler`
- English: `/services` → German: `/dienstleistungen`  
- English: `/services` → Spanish: `/servicios`
- English: `/services` → French: `/services`
- And 13 other languages with proper transliteration

**Technical Achievements:**
- **Unified Data**: Single `organization_cache` table (1745+ organizations)
- **Performance**: Strategic indexing for platform+location+category filtering
- **Services Filtering**: Platform + location filtering with live counts and cascading filters
- **Localization**: Services URLs localized to 17 languages with fallback system
- **SEO**: Static generation with dynamic metadata for all organization pages
- **Types**: Complete TypeScript integration with new schema and localized URL utilities
- **Migration**: Zero-downtime data migration from platform-specific tables
- **Build System**: Fixed generateStaticParams cookie context issues for successful builds

**Component Architecture:**
- `PlatformHome` - Platform landing pages with live statistics
- `OrganizationBrowse` - Unified browse with filtering (category, location, featured, preferred)  
- `OrganizationCard` - Individual organization display with platform branding
- `OrganizationFilters` - Advanced filtering sidebar
- `OrganizationPage` - Detailed organization view with service integration
- `ServiceLocationFilter` - Advanced location filtering with map integration (remote/online/cities)
- `entity-urls.ts` - URL mapping utility for 17 languages
- `localized-urls.ts` - Services URL localization utility for 17 languages
- `platform-translations.ts` - Platform-specific translation utilities

#### Timeline: 15-20 hours total implementation (expanded for comprehensive restructuring)

#### **MAJOR COMPLETION - Session 2025-08-14** 🎉
✅ **Platform Requirements UI/UX Enhancement Complete**: Advanced organization selection with mobile-first design
✅ **Scalable Organization Selection**: Flag-based "Select All" system handles 2,638+ organizations efficiently  
✅ **Mobile-Optimized Interface**: Responsive design with touch-friendly controls and proper spacing
✅ **Advanced Filtering**: Server-side search with pagination and debounced input (300ms)
✅ **Visual Feedback**: Clear distinction for excluded organizations with red styling and strikethrough
✅ **User Experience**: Individual deselection from "Select All" mode with excluded organizations at top

**Live Implementation Results**:
- **Scalable Organization Management**: Flag-based "Select All" system eliminates memory issues with 2,638+ organizations
- **Mobile-First Design**: Responsive interface with flattened card hierarchy and touch-optimized controls
- **Advanced Selection Features**: Individual deselection from "Select All" with visual red exclusion indicators
- **Performance Optimized**: Server-side search, pagination (50 items), debounced input, memoized computations
- **Enhanced UX**: Clear search button, excluded organizations at top, collapsible mobile sections
- **Default Service Dates**: Auto-populated availability (today + 1 month) for better user experience

**Technical Achievements**:
- **Scalable Architecture**: Flag-based selection system (`select_all_organizations`, `excluded_organizations`)
- **Responsive Design**: Mobile-first CSS with Tailwind responsive utilities (`md:` prefixes)
- **Performance Optimization**: Memoized computations, debounced search, efficient state management
- **Advanced UX Patterns**: Visual state indicators, conditional rendering, touch-friendly interfaces
- **Database Integration**: Enhanced `PlatformRule` type with exclusion support and validation

**Project Status**: Platform-First Restructuring 83% Complete (25/30 tasks)
**Next Priority**: Phase 10 Cleanup & Testing (remove legacy tables, comprehensive validation)

#### **LATEST COMPLETION - Session 2025-01-14** 🎉
✅ **Professional Flag Images Implementation Complete**: SVG flag icons replace emoji flags across all language selectors
✅ **Mobile-First Viewport Configuration**: Added proper viewport meta tag for responsive behavior
✅ **Universal Platform Compatibility**: Flag images display consistently across all operating systems and browsers
✅ **Accessibility Enhancement**: Proper alt text and keyboard navigation for flag images
✅ **Performance Optimization**: Lightweight SVG flags with crisp quality at any size

**Flag Images Implementation Details**:
- **Flag Collection**: Complete SVG flag set with 1x1 and 4x3 aspect ratios in `/public/flags/`
- **Language Configuration**: Extended Language interface with `flagIcon` property for all 17 supported languages
- **Component Updates**: All three language selector instances updated (desktop dropdown, mobile grid, standalone component)
- **Image Specifications**: Optimized sizing (`w-4 h-4` for compact, `w-5 h-5` for prominence) with proper accessibility
- **Cross-Platform**: Eliminates emoji rendering inconsistencies between Windows, macOS, and mobile platforms

**Technical Implementation**:
- **Language Config**: Added `flagIcon: '/flags/1x1/[country-code].svg'` to all language entries
- **MultilingualNavbar**: Updated desktop dropdown, mobile navigation grid (lines 330-350)
- **LanguageSwitcher**: Updated standalone component button and dropdown items
- **Accessibility**: Proper alt text with country names for screen readers
- **Styling**: Consistent `rounded-sm object-cover` styling for professional appearance

**Country Code Mapping**: 17 languages mapped to ISO country codes (cn.svg, us.svg, de.svg, es.svg, fr.svg, etc.)
**Performance**: Vector SVG graphics ensure crisp display and fast loading times

#### **IMMEDIATE UPDATE - Session 2025-01-14** 🎯
✅ **Navigation Menu Optimization Complete**: Streamlined top navigation for improved user experience
✅ **Menu Simplification**: Removed "Browse Charities" and renamed "Browse Services" to "Services"
✅ **Translation Integration**: Added "services" key to 5 major languages with proper localization
✅ **Cross-Platform Consistency**: Updated both desktop and mobile navigation menus
✅ **User Experience**: Cleaner, more focused navigation directing users to primary service discovery

**Navigation Menu Changes**:
- **Desktop Navigation**: Single "Services" link replaces dual browse options for cleaner interface
- **Mobile Navigation**: Consistent simplification with touch-friendly "Services" menu item
- **Translation Updates**: Added `nav.services` key to English, Spanish, French, German, and Turkish
- **Internationalization**: Maintains full i18n support with fallback to "Services" for untranslated languages
- **User Flow**: Direct path to service discovery without navigation complexity

**Technical Implementation**:
- **Component Updates**: MultilingualNavbar desktop and mobile sections streamlined
- **Translation Keys**: `messages?.nav?.services || 'Services'` for consistent display
- **Link Preservation**: Services URL functionality maintained with `getLocalizedServicesUrl(locale)`
- **Responsive Design**: Mobile-first approach preserved across navigation changes
- **Accessibility**: Screen reader friendly with proper text labels

### Enhanced Charity Data System
- **Automated Enhancement**: Every 30 minutes via Supabase cron
- **Comprehensive Details**: Address, contact info, impact statements, branding
- **Processing Rate**: 20 charities per run, ~960 per day
- **Coverage**: Complete database enhancement in ~4 days
- **API Integration**: JustGiving GetCharityById with multi-approach authentication
- **Complete Dataset**: 1745+ charities accessible (bypassed 1000-record client limit)
- **Advanced Filtering**: Country, city, approval status, registration status, enhanced data availability, preferred by services
- **Smart Search**: Name, description, location, registration number, keywords
- **Performance Optimized**: Server-side filtering, 24-item pagination, strategic database indexing
- **Enhanced UI**: Larger charity logos, JustGiving profile links, responsive design
- **Preferred Charity System**: Pink badge and dedicated filter for charities selected by active services

### M12 Every.org Integration Progress (Phase 2)
- **Environment Setup**: ✅ API keys configured (excluded from git)
- **API Client**: ✅ TypeScript client with search, browse, details endpoints
- **Test Interface**: ✅ `/test-everyorg` page with category discovery system
- **Database Cache**: ✅ Edge function and cron job for nonprofit population
- **Cache Population**: ✅ Fixed EIN nullable issue, working cache population (daily 1 AM)
- **API Endpoints**: ✅ REST endpoints for cached nonprofit data
- **Category System**: ✅ 13 verified working categories with dynamic discovery
- **UX Features**: ✅ Search/browse separation, tag discovery, clear buttons

**Next Session Tasks**: Donation links implementation, service integration, cross-platform analytics

**Detailed Progress**: See [PROJECT-STATUS.md](./PROJECT-STATUS.md) for complete milestone tracking, task lists, and implementation history

### **MAJOR COMPLETION - Session 2025-01-12** 🎉
✅ **Services Enhancement Complete**: Platform and location filtering with live counts and cascading filters
✅ **Services Localization**: URLs localized to 17 languages (en/services → tr/hizmetler, etc.)
✅ **Navigation Updates**: Main navigation updated with localized services paths
✅ **Internationalization Framework**: Platform-specific entity translations and utility functions
✅ **Build System Fixes**: Resolved generateStaticParams cookie context issues
✅ **TypeScript Integration**: Complete type safety with new utilities and components

**Live Implementation Results**:
- Services browse page with platform filtering (All/JustGiving/Every.org) with live counts
- Location filtering (Remote/Online, In-Person, Hybrid) with interactive map and radius selection
- Localized services URLs working across all 17 languages with fallback system
- Enhanced navigation with proper Link components and URL utilities
- Successful production build with static generation and SEO optimization

**Technical Achievements**:
- **Advanced Filtering**: Cascading platform + location + search filters with real-time updates
- **URL Localization**: `getLocalizedServicesUrl()` utility supporting 17 languages  
- **Component Reusability**: Existing browse page reused for new services route
- **Performance**: Server-side filtering with live count updates and filter summaries
- **SEO Ready**: Proper canonical URLs and hreflang support for localized paths

---

**Contact**: MEHMET AKIF ALTUNDAL | contact@poweredbydonation.com | NSW, Australia