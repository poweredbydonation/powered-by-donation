# Architecture & Infrastructure - Powered by Donation

## Technical Stack

### Frontend Stack
```
Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + next-intl
Backend: Supabase (database, auth, edge functions)
Deployment: GitHub → Vercel (automated deployment)
Package Manager: pnpm (NEVER use npm)
Internationalization: next-intl with 17 language support
```

## Platform-First Architecture

### URL Structure
```
/{locale}/                                    # Site welcome
/{locale}/services/                           # Browse all services (location + platform + category filtered)
/{locale}/services/[slug]/                    # Individual service + donation flow
/{locale}/[platform]/                         # Platform home (justgiving/everyorg)  
/{locale}/[platform]/[entity_type]/          # Browse organizations (charities/nonprofits)
/{locale}/[platform]/[entity_type]/[slug]/   # Individual organization + context actions
```

### Uniform Platform Naming Convention
**Standard**: Letters-only, no separators (-, _, .)
- **URLs**: `/justgiving/` and `/everyorg/`
- **Database**: `'justgiving'` and `'everyorg'`  
- **Edge Functions**: `justgiving_action` and `everyorg_action`
- **API Endpoints**: `/api/justgiving/*` and `/api/everyorg/*`
- **Tables**: `justgiving_charity_cache` and `everyorg_nonprofit_cache`
- **Display Names**: "JustGiving" and "Every.org" (branding preserved)

### Edge Function Reorganization
**Platform-First Naming**: `{platform}_{action}_{entity?}`
- `justgiving_create_donation_link`
- `justgiving_poll_donation_confirmation`
- `justgiving_populate_cache`
- `justgiving_fetch_enhanced_details`
- `everyorg_create_donation_link`
- `everyorg_poll_donation_confirmation`
- `everyorg_populate_cache`
- `everyorg_validate_webhook`

## Database Architecture

### Unified Organization Cache
- **Single Source**: `organization_cache` table for all platforms
- **Simple Field Names**: Standardized across platforms
- **Platform-Specific**: Data differentiated by platform column
- **Performance Optimized**: Strategic indexing for filtering

### Platform Statistics Caching System
- **Cache Table**: `platform_stats` table for pre-calculated organization counts
- **Daily Updates**: Automated cron job runs at 2 AM UTC to refresh statistics
- **Quality Filter**: Counts include `show_on_platform = true` filter for better UX
- **Performance**: Eliminated expensive COUNT queries from all organization browse APIs
- **Coverage**: Statistics for all platforms (JustGiving, Every.org, ACNC, Services)
- **Usage**: Powers both navigation statistics and pagination systems

### Data Quality Management System
- **show_on_platform Column**: Boolean field to control which organizations appear in public listings
- **Automated Quality Control**: Daily cron job (12AM) updates `show_on_platform` based on data quality rules
- **Current Rules**: JustGiving organizations without descriptions are hidden (`show_on_platform = false`)
- **API Integration**: All organization APIs filter by `show_on_platform = true` for better user experience
- **Flexible Architecture**: Easy to add more quality criteria (logo quality, data completeness, etc.)

## Component Architecture

**Split by pain, not by rules.** Create new components when existing ones become difficult to work with, not because they hit arbitrary line limits.

### Component Size Targets
- **Pages**: 100-200 lines (orchestration)
- **Sections**: 50-100 lines (major UI areas)
- **Features**: 20-50 lines (business logic)
- **UI Components**: 10-30 lines (generic elements)

### Key Components
- `PlatformHome` - Platform landing pages with live statistics
- `OrganizationBrowse` - Unified browse with filtering (category, location, featured, preferred)  
- `OrganizationCard` - Individual organization display with platform branding
- `OrganizationFilters` - Advanced filtering sidebar
- `OrganizationPage` - Detailed organization view with service integration
- `ServiceLocationFilter` - Advanced location filtering with map integration (remote/online/cities)
- `entity-urls.ts` - URL mapping utility for 17 languages
- `localized-urls.ts` - Services URL localization utility for 17 languages
- `platform-translations.ts` - Platform-specific translation utilities

## Performance Optimization

### Server-Side Strategy
- **Server-Side Filtering**: All filtering operations performed at database level
- **Strategic Indexing**: Performance-optimized indexes for common query patterns
- **Pagination**: Traditional numbered pagination (24 items per page) with preemptive loading
- **Cached Statistics**: Pre-calculated counts eliminate expensive real-time queries

### Dynamic vs Static Generation
- **Dynamic First**: Use `export const dynamic = 'force-dynamic'` when pages need any dynamic behavior
- **Static Generation**: Only for truly static content that will never need dynamic features
- **Hybrid Approach**: Static generation with dynamic metadata for SEO optimization

## Enhanced Organization Data System
- **Automated Enhancement**: Every 30 minutes via Supabase cron
- **Comprehensive Details**: Address, contact info, impact statements, branding
- **Processing Rate**: 20 charities per run, ~960 per day
- **Coverage**: Complete database enhancement in ~4 days
- **API Integration**: JustGiving GetCharityById with multi-approach authentication
- **Complete Dataset**: 1745+ charities accessible (bypassed 1000-record client limit)
- **Advanced Filtering**: Country, city, approval status, registration status, enhanced data availability, preferred by services
- **Smart Search**: Name, description, location, registration number, keywords
- **Enhanced UI**: Larger charity logos, JustGiving profile links, responsive design
- **Preferred Charity System**: Pink badge and dedicated filter for charities selected by active services