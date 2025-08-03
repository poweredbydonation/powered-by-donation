# Claude Development Guide - Powered by Donation

## Project Overview

**Powered by Donation** is a donation-service marketplace where service providers offer skills in exchange for charitable donations. Service seekers browse services and make donations to JustGiving charities. We facilitate connections but don't handle payments directly.

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

## Core Architecture Principles

### Privacy Model: Anonymous + Aggregate + Optional Sharing
- **Always Anonymous**: No public donor names or persistent identities
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to get personal credit
- **Private Connections**: Donor names shared with providers & charities only

### Component Architecture
**Split by pain, not by rules.** Create new components when existing ones become difficult to work with, not because they hit arbitrary line limits.

#### Component Size Targets:
- **Pages**: 100-200 lines (orchestration)
- **Sections**: 50-100 lines (major UI areas)
- **Features**: 20-50 lines (business logic)
- **UI Components**: 10-30 lines (generic elements)

### Database: Unified User System
Single `users` table supporting both provider and supporter roles with happiness-based reputation metrics. See [README-database.md](./README-database.md) for complete schema details.

## Service Management & Quality System

### Mutual Happiness Feedback
Both providers and supporters rate each service interaction with simple happy/unhappy ratings. This creates:
- **Quality control** through happiness metrics and filtering
- **Service access requirements** based on reputation scores  
- **Balanced feedback** maintaining donor-centric approach

### Service Features
- **Fixed donation amounts** (e.g., exactly $50, not minimum or variable)
- **Charity requirements** ("any charity" or "specific charities")
- **Availability management** (date ranges and capacity limits)
- **Location flexibility** (physical, remote, or hybrid delivery)

## Charity & SEO System

### Charity Pages: Anonymous Impact Display
Charity pages at `/charity/[slug]` showcase service-driven donations with complete anonymity:
- **Anonymous activity**: "Someone donated $50 via Web Design service"
- **Aggregate statistics**: Total donations, monthly activity, service categories  
- **JustGiving integration**: Real charity data with SEO optimization

See [README-seo.md](./README-seo.md) for complete SEO strategy and implementation details.

## JustGiving Integration

### Donation Flow Implementation
The platform integrates with JustGiving's staging environment for secure charitable donations:

#### Core Components:
- **JustGiving Client** (`src/lib/justgiving/client.ts`): Handles API calls and URL generation
- **Donation Flow** (`src/components/services/ServiceDonationFlow.tsx`): User donation interface
- **Success Page** (`src/app/[locale]/donation-success/page.tsx`): Post-donation confirmation

#### URL Format:
```
https://link.staging.justgiving.com/v1/charity/donate/charityId/{id}?
donationValue={amount}&
currency=GBP&
exiturl={returnUrl}&
reference={serviceReference}&
skipGiftAid=true
```

#### Key Features:
- **Staging Environment**: Uses `link.staging.justgiving.com` for testing
- **Fixed Amounts**: Exact donation values, not minimums
- **Localized Returns**: Redirects to `/[locale]/donation-success` 
- **Donation Tracking**: JustGiving provides `jgDonationId` for confirmation
- **International Support**: `skipGiftAid=true` for non-UK donors

#### Environment Variables:
- `NEXT_PUBLIC_JUSTGIVING_CHARITY_CHECKOUT_URL`: Override default staging URL
- `NEXT_PUBLIC_APP_URL`: Base URL for donation return redirects
- `JUSTGIVING_API_KEY`: API access for charity validation (defaults to staging key)

## User Experience & Internationalization

### Design Philosophy
- **Fixed layouts** - Consistent page structures for all entity types
- **Mobile-first** - Responsive design with accessibility focus
- **Simple privacy controls** - Basic show/hide toggles only
- **No customization** - Identical, optimized layouts for all users

### User Journeys
#### Anonymous Browsing
Browse services freely without signup - view pricing, charity requirements, provider info, and anonymous donation activity.

#### Provider Journey  
Sign up → Create services → Set fixed pricing → Choose charity requirements → Receive donations → Give/receive feedback

#### Supporter Journey
Browse services → View fixed pricing → Choose charity → Sign up → Donate via JustGiving → Confirmation page → Give feedback → Build reputation

### Internationalization: 17 Language Support
Complete translation coverage using next-intl with centralized language configuration in `src/config/languages.ts`.

See [README-internationalization.md](./README-internationalization.md) for complete i18n implementation details.

## Development Information

### Brand Guidelines
- **Logo**: "PD" (text-based) or "Powered by Donation" (full name)
- **Typography**: System fonts only (no external dependencies)
- **Design**: Clean, fast-loading, accessibility-first, charitable aesthetic

### Development Environment
See [README-development.md](./README-development.md) for complete development setup, deployment workflows, and environment details.

## Essential Claude Guidelines

### Core Principles
1. **pnpm only** - Never suggest npm commands
2. **Anonymous always** - No public donor names, identities, or tracking  
3. **Fixed pricing** - Services have exact donation amounts (never minimum/variable)
4. **Unified user system** - Single users table for both provider and supporter roles
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
- **Quality feedback**: "Happy with provider?" not "Did you receive service?"
- **Charity requirements**: Either "any charity" or "specific charities"

### Technical Requirements
- **SEO first**: Meta tags and structured data for all pages
- **Static generation**: Pre-render service/charity pages  
- **Performance**: System fonts only, Core Web Vitals optimization
- **Accessibility**: WCAG 2.1 compliance, mobile-first design

---

**Contact**: MEHMET AKIF ALTUNDAL | contact@poweredbydonation.com | NSW, Australia