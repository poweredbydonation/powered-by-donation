# Powered by Donation

**Service marketplace where fundraisers offer skills in exchange for charitable donations**

## Overview

Powered by Donation is a dual-platform donation marketplace connecting service fundraisers with donors who make charitable contributions to access services. The platform supports both JustGiving and Every.org (Phase 2) platforms, enabling global charitable giving through service-driven transactions.

### How It Works

1. **Fundraisers** create services with fixed donation amounts
2. **Donors** browse services and choose preferred charities/nonprofits
3. **Donations** go directly to verified charitable organizations
4. **Services** are delivered after donation confirmation
5. **Community** provides mutual feedback for quality assurance

## Core Features

### Dual Platform Support
- **JustGiving Integration** (Available Now): UK-based charity platform
- **Every.org Integration** (Phase 2): Global nonprofit platform
- **Platform-Specific URLs**: `/justgiving/charity/[slug]` and `/everyorg/nonprofit/[slug]`
- **Sequential References**: PD-JG-1001, PD-EV-1001 tracking system

### Service Marketplace
- **Fixed Pricing**: Exact donation amounts (e.g., $50, not minimum)
- **Charity Choice**: "Any charity" or "specific charities" options
- **Location Flexibility**: Remote, physical, or hybrid service delivery
- **Availability Management**: Date ranges and capacity limits

### Privacy-First Architecture
- **Anonymous Public Display**: No donor names or identities visible publicly
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to share personal credit
- **Private Connections**: Donor details shared only with fundraisers and charities

### Automated Donation Tracking
- **Sequential References**: Unique tracking codes for each platform
- **Real-Time Status Updates**: Immediate confirmation via success page
- **Server-Side Polling**: 5-minute backup verification system
- **Fundraiser Notifications**: Automated email alerts on confirmed donations

### Quality Assurance System
- **Mutual Feedback**: Both fundraisers and donors rate experiences
- **Happiness Metrics**: Simple happy/unhappy ratings for quality control
- **Reputation Scoring**: Built from community feedback patterns
- **Service Filtering**: Browse by happiness ratings and reputation

### Internationalization
- **17 Languages**: Complete translation coverage via next-intl
- **Global Accessibility**: Multi-language charity/nonprofit support
- **Localized URLs**: `/[locale]/justgiving/charity/[slug]` structure

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deployment**: GitHub → Vercel (automated)
- **Internationalization**: next-intl with 17 language support
- **Package Manager**: pnpm (required)

### Database Schema
- **Unified User System**: Single users table supporting dual roles
- **Platform-Aware Services**: Platform field determines charity/nonprofit options  
- **Sequential References**: Platform-specific donation tracking
- **Anonymous Statistics**: Privacy-compliant aggregate data only

### Key APIs
- **JustGiving API**: Donation URLs, charity search, status verification
- **Platform-Specific Endpoints**: `/api/just-giving/` and `/api/every-org/`
- **Automated Polling**: Edge Functions for donation status tracking
- **Notification System**: Email templates for fundraiser alerts

## Project Structure

```
powered-by-donation/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [locale]/          # Internationalized routes
│   │   └── api/               # Platform-specific API endpoints
│   ├── components/            # React components
│   │   ├── services/          # Service-related components
│   │   ├── ui/               # Generic UI components
│   │   └── forms/            # Form components
│   ├── lib/                  # Utility libraries
│   │   ├── justgiving/       # JustGiving integration
│   │   └── supabase/         # Database utilities
│   ├── messages/             # i18n translation files (17 languages)
│   └── types/                # TypeScript definitions
├── supabase/
│   ├── migrations/           # Database migrations
│   └── functions/            # Edge Functions
└── public/                   # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (required - do not use npm)
- Supabase account
- JustGiving API credentials

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/poweredbydonation/powered-by-donation.git
   cd powered-by-donation
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Configure environment variables
   ```

4. **Database Setup**
   ```bash
   supabase start
   supabase db push
   supabase gen types typescript --local > src/types/database.ts
   ```

5. **Development Server**
   ```bash
   pnpm run dev
   ```

### Key Commands

```bash
# Development
pnpm run dev          # Start development server
pnpm run build        # Production build
pnpm run type-check   # TypeScript validation
pnpm run lint         # Code quality checks

# Database
supabase migration new migration_name
supabase db push
supabase gen types typescript --local > src/types/database.ts
```

## Development Guidelines

### Code Standards
- **TypeScript**: Required for all code
- **Component Architecture**: Split by complexity, not line count
- **Privacy First**: Never expose donor identities publicly
- **Platform Awareness**: All features must support dual platforms
- **Translation Keys**: Use next-intl for all user-facing text

### Testing Approach
- **Unit Tests**: Utility functions and hooks
- **Integration Tests**: Key user flows
- **Manual Testing**: Cross-browser and accessibility
- **Live Testing**: End-to-end donation flows

## Deployment

### Production Environment
- **URL**: https://powered-by-donation.vercel.app
- **Branch**: `main`
- **Database**: Production Supabase project
- **Deployment**: Automatic on push to main

### Development Environment  
- **URL**: https://dev-powered-by-donation.vercel.app
- **Branch**: `dev`
- **Database**: Development Supabase project
- **Deployment**: Automatic on push to dev

## Business Information

- **Entity**: Sole Trader - MEHMET AKIF ALTUNDAL
- **ABN**: 17 927 784 658
- **Location**: NSW, Australia
- **Contact**: contact@poweredbydonation.com

### Compliance
- **Privacy Act 1988** (Australia) - Anonymous data handling
- **Australian Consumer Law** - Fixed pricing transparency
- **NSW Charitable Fundraising Act** - Platform facilitation model

## Contributing

### Development Workflow
1. **Feature Branch**: Create from `dev` branch
2. **Implementation**: Follow coding standards and component architecture
3. **Testing**: Manual testing of changes
4. **Pull Request**: Submit to `dev` branch
5. **Review**: Code review and feedback
6. **Merge**: Deploy to development environment
7. **Production**: Merge `dev` to `main` for production release

### Reporting Issues
- **GitHub Issues**: https://github.com/anthropics/claude-code/issues
- **Email**: contact@poweredbydonation.com

## Documentation

- **[Database Schema](./README-database.md)**: Complete schema documentation
- **[SEO Strategy](./README-seo.md)**: Search optimization approach
- **[Development Guide](./README-development.md)**: Technical implementation details
- **[Internationalization](./README-internationalization.md)**: Multi-language support

## License

This project is proprietary software. All rights reserved.

---

**PoweredByDonation.com** - Connecting charitable giving with community services