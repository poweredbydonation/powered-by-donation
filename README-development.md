# Development Guide - Powered by Donation

## Development Timeline & Progress

### Phase 1: MVP Development (Weeks 1-8)

#### ✅ **Week 1 COMPLETED**: Next.js foundation + SEO setup + anonymous privacy model
- ✅ Next.js 14 foundation with App Router, TypeScript, Tailwind CSS
- ✅ SEO setup with comprehensive metadata, Open Graph, structured data
- ✅ Anonymous privacy model implemented with database schema and RLS policies
- ✅ Complete database foundation with all core tables
- ✅ TypeScript types for full type safety and development support
- ✅ Row Level Security (RLS) policies for privacy compliance
- ✅ Database functions for automatic stats calculation and happiness metrics
- ✅ Authentication system with Supabase OAuth providers

#### ✅ **Week 1.5 COMPLETED**: User Profile Management System
- ✅ Smart dashboard with role detection (provider/supporter profiles)
- ✅ Complete provider profile creation and management system
- ✅ Complete supporter profile creation and management system
- ✅ Profile editing functionality with tabbed interface
- ✅ Profile deletion with safety checks and confirmation dialogs
- ✅ Privacy controls for both provider and supporter profiles
- ✅ Real-time dashboard updates (no manual refresh needed)
- ✅ Account settings and profile management interface

#### ✅ **Week 2 COMPLETED**: Service marketplace + fixed pricing system + charity requirements
- ✅ Service creation form with suburb-level location handling
- ✅ Service management dashboard for providers
- ✅ Fixed pricing system implementation (exact donation amounts)
- ✅ Charity requirement selection (any charity vs specific charities)
- ✅ Location options (remote, physical, hybrid service delivery)
- ✅ Availability date ranges and capacity management
- ✅ Consistent navigation across all dashboard pages
- ✅ Anonymous donation examples on homepage with elegant messaging

#### ✅ **Week 4 COMPLETED**: JustGiving integration + real donation flow + charity cache system
- ✅ Lightning-fast charity cache system with sub-50ms search performance
- ✅ Complete donation flow integration with both "any charity" and "specific charities" modes
- ✅ Real JustGiving API integration with proper URL generation and tracking references
- ✅ Advanced charity selector component with real-time search and multi-selection
- ✅ ServiceDonationFlow component with authentication handling and error management
- ✅ CharitySearchModal with popular charity suggestions and full search functionality
- ✅ Updated service creation form with charity selection UI
- ✅ Comprehensive test interfaces for donation flow and charity cache management
- ✅ Fixed JustGiving staging URL format with proper parameters (donationValue, currency, exiturl)
- ✅ Added donation success page with JustGiving donation ID confirmation
- ✅ End-to-end donation flow testing and validation completed

#### ✅ **Week 5 COMPLETED**: Internationalization + unified user system
- ✅ Complete internationalization system with next-intl
- ✅ 17 language support: English, Chinese, Arabic, Vietnamese, Cantonese, Punjabi, Greek, Italian, Filipino, Hindi, Spanish, Turkish, German, French, Japanese, Korean, Portuguese
- ✅ Unified user system replacing separate providers/supporters tables
- ✅ Database migration to consolidated users table with dual role support
- ✅ Updated authentication and profile management for unified system
- ✅ Comprehensive translation keys for all user-facing content
- ✅ Language switcher component with smooth locale transitions
- ✅ Proper locale routing and middleware configuration

#### ⏳ **Remaining Timeline**:
- **Week 6**: Provider-supporter connections + satisfaction feedback system
- **Week 7**: Email automation + service status tracking  
- **Week 8**: Social sharing features + advanced reputation system
- **Week 9**: Testing, optimization, production deployment

### Phase 2: Not-for-Profit Transition (Weeks 10-17)
- Legal structure transition
- Mobile app development (React Native - separate repository)
- Enhanced analytics and reporting
- Grant applications

### Phase 3: Charity Registration (Weeks 18-25)
- ACNC charity application
- Platform scaling and optimization
- Major funding applications
- Community growth initiatives

## Technical Constraints & Requirements

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
│   ├── app/                                  # App Router pages
│   ├── components/                           # React components
│   ├── config/                               # Configuration files
│   ├── hooks/                                # Custom React hooks
│   ├── lib/                                  # Utility libraries
│   ├── messages/                             # i18n translation files
│   └── types/                                # TypeScript type definitions
├── public/                                   # Static assets
├── supabase/                                 # Backend & Database
│   ├── migrations/                           # Database migrations
│   └── functions/                            # Edge functions
├── __tests__/                                # Testing
├── .github/                                  # CI/CD workflows
├── docs/                                     # Documentation
├── package.json                              # Project dependencies
├── next.config.js                            # Next.js configuration
├── tailwind.config.js                        # Tailwind CSS config
├── tsconfig.json                             # TypeScript config
└── .env.example                              # Environment variables template
```

## Key Commands & Practices

### Package Management
```bash
# ALWAYS use pnpm, never npm
pnpm install
pnpm add package-name
pnpm run dev
pnpm run build
pnpm run type-check
pnpm run lint
```

### Database Management
```bash
# Supabase migrations
supabase migration new migration_name
supabase db push
supabase gen types typescript --local > types/database.ts

# Start local development
supabase start
supabase stop
```

### Development Workflow
```bash
# Development workflow
git checkout dev
git add .
git commit -m "feature: description"
git push origin dev  # Triggers automatic deployment to dev.powered-by-donation

# Production deployment
git checkout main
git merge dev  # or create PR: dev → main
git push origin main  # Triggers automatic deployment to powered-by-donation
```

## Development & Production Environments

### Production Environment
- **GitHub Branch**: `main` - https://github.com/poweredbydonation/powered-by-donation/tree/main
- **Vercel Project**: `powered-by-donation` - https://vercel.com/poweredbydonations-projects/powered-by-donation
- **Supabase Project**: `production` - https://supabase.com/dashboard/project/pdazwmicqrxcvbhmfwmy
- **URL**: https://powered-by-donation.vercel.app

#### Development Environment  
- **GitHub Branch**: `dev` - https://github.com/poweredbydonation/powered-by-donation/tree/dev
- **Vercel Project**: `dev.powered-by-donation` - https://vercel.com/poweredbydonations-projects/dev.powered-by-donation
- **Supabase Project**: `dev` - https://supabase.com/dashboard/project/ktwlhjgomcbbjynfefys
- **URL**: https://dev-powered-by-donation.vercel.app

### Environment Variables
Environment variables are managed via respective Vercel dashboards:
- Database connections (Supabase URLs and keys)
- JustGiving API credentials
- Authentication secrets
- Third-party service configurations

### Deployment Workflow
- **Development**: Automatic deployment on push to `dev` branch
- **Production**: Automatic deployment on push to `main` branch
- **No manual deployment commands needed**
- **Environment-specific configurations handled automatically**

## Component Architecture Guidelines

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

### File Organization Rules

#### By Feature, Not by Type
Organize components by business feature rather than technical type

#### Logical Grouping:
- **Pages**: Main route components (100-200 lines)
- **Sections**: Major UI areas (50-100 lines)  
- **Features**: Reusable business logic (20-50 lines)
- **UI**: Generic interface elements (10-30 lines)

### Custom Hooks Strategy
Extract complex logic to custom hooks while keeping related UI elements in the same component.

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

## Quality Assurance

### Testing Strategy
- Unit tests for utility functions and hooks
- Integration tests for key user flows
- Manual testing across different devices and browsers
- Accessibility testing with screen readers

### Code Quality
- TypeScript for type safety
- ESLint for code consistency
- Prettier for code formatting
- Pre-commit hooks for quality checks

### Performance Requirements
- Core Web Vitals optimization
- Static generation for service/charity pages
- Image optimization and lazy loading
- Minimal JavaScript bundle size

### Security Considerations
- Row Level Security (RLS) in Supabase
- Environment variable protection
- Input validation and sanitization
- HTTPS everywhere
- Privacy-first data handling

---

*This development guide should be referenced for all technical implementation decisions and development workflows.*