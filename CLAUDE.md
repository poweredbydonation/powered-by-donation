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
6. **JustGiving only** - Only registered charities allowed
7. **Component splitting** - Split by pain, not by arbitrary rules
8. **Translation keys** - Use next-intl for all user-facing text
9. **Australian compliance** - Privacy Act, Consumer Law considerations
10. **GitHub deployment** - All changes via Git push, not manual commands

### Key Patterns
- **Anonymous displays**: "Someone donated $50 via Web Design service"
- **Aggregate statistics**: "47 donations this month" 
- **Fixed layouts**: Consistent page structures, no user customization
- **Quality feedback**: "Happy with fundraiser?" not "Did you receive service?"
- **Charity requirements**: Either "any charity" or "specific charities"

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
#### Anonymous Browsing
Browse services freely without signup - view pricing, charity requirements, fundraiser info, and anonymous donation activity.

#### Fundraiser Journey  
Sign up → Create services → Set fixed pricing → Choose charity requirements → Receive donations → Give/receive feedback

#### Donor Journey
Browse services → View fixed pricing → Choose charity → Sign up → Donate via JustGiving → Confirmation page → Give feedback → Build reputation

## Development Workflow
- **Database**: See `supabase/CLAUDE.md` for schema, migrations, and Supabase-specific guidelines
- **Frontend**: See `src/CLAUDE.md` for component patterns, internationalization, and UI development
- **Documentation**: Updated README files in root contain detailed implementation guides

## Current Status
**Completed**: Provider→Fundraiser & Supporter→Donor terminology rename (100% complete)
**Completed**: M11 - Browse Charities System with enhanced charity data fetching
**Active Project**: Enhanced charity database with detailed information (GetCharityById API)
**Next Priority**: M12 (Phase 2 Every.org Integration)

### Enhanced Charity Data System
- **Automated Enhancement**: Every 30 minutes via Supabase cron
- **Comprehensive Details**: Address, contact info, impact statements, branding
- **Processing Rate**: 20 charities per run, ~960 per day
- **Coverage**: Complete database enhancement in ~4 days
- **API Integration**: JustGiving GetCharityById with multi-approach authentication
- **Complete Dataset**: 1745+ charities accessible (bypassed 1000-record client limit)
- **Advanced Filtering**: Country, approval status, registration status, enhanced data availability
- **Smart Search**: Name, description, location, registration number, keywords
- **Pagination Strategy**: Multi-batch loading for complete dataset access

**Detailed Progress**: See [PROJECT-STATUS.md](./PROJECT-STATUS.md) for complete milestone tracking, task lists, and implementation history

---

**Contact**: MEHMET AKIF ALTUNDAL | contact@poweredbydonation.com | NSW, Australia