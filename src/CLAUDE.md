# Frontend Development Guide - Powered by Donation

## Next.js App Router Architecture

### Directory Structure
```
src/
├── app/[locale]/           # Internationalized routes
├── components/             # Reusable React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
├── messages/               # i18n translation files
└── types/                  # TypeScript type definitions
```

## Internationalization (i18n)

### 17 Language Support
Complete translation coverage using next-intl with centralized language configuration in `src/config/languages.ts`.

**Supported Languages**: English, German, Spanish, French, Italian, Portuguese, Japanese, Turkish, Korean, Chinese, Arabic, Hindi, Filipino, Greek, Cantonese, Punjabi, Vietnamese

### Translation Guidelines
- **Use next-intl**: `useTranslations()` hook for all user-facing text
- **Key Naming**: Descriptive keys like `'services.donation.amount'`
- **Pluralization**: Use next-intl's plural rules
- **Context**: Provide context for translators in key structure

### Routing Patterns (Correct Implementation)
- **Server components**: `<a href="">` (correct)
- **Client components with same-locale navigation**: `<Link>` from next-intl (correct)
- **Client components with cross-locale navigation**: `<a href="">` (correct)

The routing follows next-intl best practices: same-locale uses Link for SPA behavior, cross-locale uses anchor tags for proper internationalization context switching.

## Component Architecture

### Component Hierarchy
**Split by pain, not by rules.** Create new components when existing ones become difficult to work with.

#### Component Types & Size Targets:
- **Pages**: 100-200 lines (orchestration)
- **Sections**: 50-100 lines (major UI areas)  
- **Features**: 20-50 lines (business logic)
- **UI Components**: 10-30 lines (generic elements)

#### Preferred Charity System:
- **Badge Display**: Pink sparkles badge shows "Preferred by Services" on charity cards
- **Service Integration**: Queries `services.preferred_charities` JSONB field for charity_id matching
- **Filtering**: Dedicated filter section allows showing only preferred charities
- **Performance**: Server-side filtering with preferredCharityIds Set for O(1) lookups

### Performance Optimization Patterns
- **Server-side filtering**: Database handles search/filtering instead of client-side processing
- **Pagination**: 24 items per page for optimal loading and UX
- **Debounced search**: 300ms delay prevents excessive API calls
- **Strategic indexing**: Database indexes for common query patterns

#### Key Component Patterns:
```typescript
// Service-related components
ServiceCard.tsx           // Individual service display
ServiceList.tsx           // Service listing with filtering
ServiceCreationForm.tsx   // Service creation interface with multi-platform requirements
ServiceDonationFlow.tsx   // Donation process handling
PlatformRequirementsSelector.tsx // Multi-platform hierarchy selection system

// User-related components  
UnifiedUserProfileForm.tsx // Single form for all user types
AuthGuard.tsx             // Route protection
PlatformSelector.tsx      // Platform switching

// Platform-specific components
CharityCard.tsx           // JustGiving charity display with logos and profile links
PlatformAccessGuard.tsx   // Cross-platform access control
OrganizationCard.tsx      // Unified organization display for both platforms
OrganizationBrowse.tsx    // Platform-aware organization browsing
```

## Design Philosophy

### Fixed Layouts
- **Consistent page structures** for all entity types
- **Mobile-first** responsive design with accessibility focus
- **Simple privacy controls** - Basic show/hide toggles only
- **No customization** - Identical, optimized layouts for all users

### Brand Guidelines
- **Logo**: "PD" (text-based) or "Powered by Donation" (full name)
- **Typography**: System fonts only (no external dependencies)
- **Design**: Clean, fast-loading, accessibility-first, charitable aesthetic

## Platform Integration

### Dual Platform Support
- **JustGiving**: Live platform (blue theme)
- **Every.org**: Phase 2 (green theme, placeholder UI)

### Platform-Aware Components
```typescript
// Platform filtering
const platformFilter = user?.preferred_platform || selectedPlatform;

// Platform-specific styling
const platformClass = platform === 'justgiving' ? 'bg-blue-500' : 'bg-green-500';

// Platform-specific navigation  
href={`/${locale}/justgiving/charity/${charity.slug}`}
```

## Authentication & Authorization

### Supabase Auth Integration
```typescript
// AuthContext usage
const { user, loading } = useAuth();

// Route protection
<AuthGuard>{/* Protected content */}</AuthGuard>

// Conditional rendering
{user ? <DashboardLink /> : <LoginButton />}
```

### User Role Management
- **Unified System**: Single user table, multiple roles via preferences
- **Role-based UI**: Show/hide features based on user setup completion
- **Permission Checks**: Frontend + backend authorization

## API Integration

### Platform-Specific Endpoints
```typescript
// JustGiving donations
const response = await fetch(`/api/just-giving/charity/${charityId}`, {
  method: 'POST',
  body: JSON.stringify({ serviceId, amount })
});

// Every.org placeholder
const response = await fetch(`/api/every-org/non-profit/${nonprofitId}`, {
  method: 'POST', // Returns "Coming Soon" in Phase 1
});
```

### Error Handling
- **User-friendly messages**: Translate error codes to readable text
- **Fallback states**: Graceful degradation for API failures
- **Loading states**: Show progress during async operations

## State Management

### React Context Patterns
```typescript
// Auth state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Platform preferences (handled via AuthContext)
const { user } = useAuth();
const preferredPlatform = user?.preferred_platform || 'justgiving';
```

### Custom Hooks
```typescript
// Donation status tracking
const { pendingDonations, loading } = usePendingDonations();

// Service pricing
const { formatPrice } = useServicePrice();

// Authentication state
const { user, signOut, loading } = useAuth();
```

## Performance Optimization

### Core Web Vitals Focus
- **System fonts only**: No external font dependencies
- **Image optimization**: Next.js Image component with proper sizing
- **Code splitting**: Dynamic imports for large components
- **Static generation**: Pre-render service/charity pages

### SEO Implementation
- **Meta tags**: Dynamic titles and descriptions
- **Structured data**: JSON-LD for services and charities
- **OpenGraph**: Social media sharing optimization
- **Sitemap**: Automated generation for all routes

## Accessibility (WCAG 2.1)

### Key Requirements
- **Keyboard navigation**: Full app usable without mouse
- **Screen reader support**: Proper ARIA labels and descriptions
- **Color contrast**: AA compliance for all text
- **Focus management**: Visible focus indicators
- **Alternative text**: Images and icons properly labeled

### Implementation Patterns
```typescript
// Accessible buttons
<button 
  aria-label="Donate to charity"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>

// Form accessibility  
<label htmlFor="amount" className="sr-only">Donation amount</label>
<input id="amount" aria-describedby="amount-help" />
<div id="amount-help">Enter amount in GBP</div>
```

## Testing Strategy

### Component Testing
- **Jest + React Testing Library**: Unit tests for components
- **User-centric tests**: Test behavior, not implementation
- **Accessibility tests**: Automated a11y checks
- **i18n testing**: Verify translations render correctly

### Integration Testing
- **API endpoints**: Test platform-specific donation flows
- **Authentication**: Login/logout and protected routes
- **Platform switching**: User preference persistence
- **Error scenarios**: Network failures and edge cases

## Development Workflow

### Code Quality
- **TypeScript strict mode**: Full type safety
- **ESLint + Prettier**: Automated code formatting
- **Husky pre-commit hooks**: Prevent bad commits
- **Build validation**: No warnings in production builds

### Component Development
1. **Design first**: Mobile-first responsive approach
2. **Accessibility**: Built-in from the start
3. **i18n ready**: All text via translation keys
4. **Type safety**: Full TypeScript interface coverage
5. **Testing**: Unit tests for complex logic

## Multi-Platform Service Creation System

### Platform Requirements Architecture
The service creation system uses a hierarchical platform → organization selection model:

```typescript
interface PlatformRequirements {
  type: PlatformRestrictionType;
  allowed_platforms: DonationPlatform[];
  platform_rules: Record<DonationPlatform, PlatformRule>;
}

interface PlatformRule {
  entity_types: EntityRestrictionType;
  allowed_entities: string[];
  organizations: OrganizationRestrictionType;
  specific_organizations: string[];
}
```

### User Experience Flow
**Platform Selection:**
- Multiple platform selection with checkboxes
- "Select All Platforms" / "Clear All" functionality
- Auto-expansion when platforms are selected

**Organization Selection (per platform):**
- Auto-loads organizations from unified `organization_cache`
- Search functionality with real-time filtering
- "Select All" / "Clear All" for organization management
- Visual organization cards with logos and names

### Component Implementation
**PlatformRequirementsSelector.tsx:**
- Hierarchical UI with progressive disclosure
- Real-time validation and error handling
- Integrated with organization search and selection
- Full TypeScript integration with type safety

### Database Integration
- New `platform_requirements` field in services table (JSONB)
- Unified organization data from `organization_cache`
- Backward compatibility with legacy `charity_requirement_type`
- Advanced validation for multi-platform configurations

## Current Implementation Status

### Completed Features
- ✅ 17-language internationalization system
- ✅ Dual platform UI (JustGiving + Every.org placeholders)
- ✅ Unified user profile system
- ✅ Platform-aware service creation and browsing
- ✅ Multi-platform service creation with hierarchical organization selection
- ✅ Donation flow with JustGiving integration
- ✅ Browse charities system (1737+ charities) with pagination and city filtering
- ✅ Preferred charity badges and filtering (shows charities selected by services)
- ✅ Notification system for donors and fundraisers
- ✅ Performance optimization: server-side filtering, strategic indexing, debounced search
- ✅ Advanced filtering system: Multi-select categories (Every.org), single-select with inline dropdowns (ACNC)
- ✅ Optimized database performance: GIN indexes for JSONB filtering, sub-second query performance

### Component Inventory
- ✅ **Authentication**: Login, signup, auth guards
- ✅ **Services**: Creation, browsing, donation flow
- ✅ **Users**: Unified profile management
- ✅ **Platform**: Cross-platform access control
- ✅ **Charity**: Browse and discovery system
- ✅ **Notifications**: Pending donations and confirmations

### M12 Every.org Integration (Phase 2 - In Progress)
- ✅ Every.org API client (`src/lib/everyorg/client.ts`)
- ✅ Test interface (`src/app/test-everyorg/page.tsx`) with advanced UX features:
  - Search/browse mode separation
  - Dynamic category discovery from nonprofit tags
  - 13 verified working categories with visual indicators
  - Real-time search with 500 requests/minute capacity
  - Proper result count display and pagination
- ✅ API routes (`/api/everyorg/*`) for cached nonprofit access
- ⏳ Service creation form integration (next session)
- ⏳ Platform selector components
- ⏳ Donation flow integration
- ⏳ Enhanced search and filtering
- ⏳ Advanced analytics dashboards