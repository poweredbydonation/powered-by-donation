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
**Active Project**: Platform-First URL Restructuring - Major Architecture Overhaul
**Next Priority**: Context-Driven User Experience Implementation

### Major Architecture Project: Platform-First Restructuring

#### Project Goal
Transform entire application from entity-first to platform-first architecture with context-driven user actions and cross-platform freedom.

#### New URL Structure
```
/{locale}/                              # Site welcome
/{locale}/[platform]/                   # Platform home (justgiving/everyorg)  
/{locale}/[platform]/charities/         # Browse platform charities
/{locale}/[platform]/charities/[slug]/  # Individual charity + context actions
/{locale}/[platform]/services/          # Browse platform services
/{locale}/[platform]/services/[slug]/   # Individual service + donation flow
```

#### Key Changes
- **Platform-Agnostic Users**: Remove preferred_platform from user profiles
- **Unified Data**: Single charity cache table for both platforms
- **Context Actions**: Create services/donations directly from charity/service pages
- **Cross-Platform Freedom**: Users can switch between platforms freely
- **Natural Discovery**: Browse within platform context, no forced platform selection
- **Uniform Naming**: Letters-only platform names (justgiving/everyorg) across all contexts

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

#### Implementation Progress (13 Tasks Total)
1. ✅ **Project Planning**: Comprehensive plan documented in CLAUDE.md
2. ✅ **Naming Standards**: Uniform platform-first naming convention established
3. ⏳ **Database Migration**: Create unified charity cache, remove platform restrictions
4. ⏳ **Dynamic Routing**: Implement [platform] routing structure
5. ⏳ **Platform Pages**: Build platform homes and collection pages
6. ⏳ **Context Actions**: Add "Create Service for [Charity]" functionality
7. ⏳ **Edge Function Rename**: Implement uniform platform-first function naming
8. ⏳ **Navigation Update**: Update all internal links and components
9. ⏳ **Legacy Cleanup**: Remove old browse structure
10. ⏳ **Testing**: Comprehensive flow testing and optimization

#### Timeline: 8-10 hours total implementation (expanded for edge function reorganization)

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

---

**Contact**: MEHMET AKIF ALTUNDAL | contact@poweredbydonation.com | NSW, Australia