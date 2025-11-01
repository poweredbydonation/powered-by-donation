# Development Guidelines - Powered by Donation

## Essential Development Principles

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

## Privacy Model: Anonymous + Aggregate + Optional Sharing
- **Always Anonymous**: No public donor names or persistent identities
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to get personal credit
- **Private Connections**: Donor names shared with fundraisers & charities only

## User Journeys

### Platform-First Navigation
Users navigate platform-first: `/{locale}/justgiving/` or `/{locale}/everyorg/` → explore charities/services within platform context.

### Anonymous Browsing
Browse any platform freely → view charities and services → context-driven donations without signup required.

### Context-Driven Service Creation
Browse platform charities → find interesting charity → click "Create Service for [Charity]" → service form pre-filled with platform + charity context.

### Natural Donation Flow  
Browse services → view fixed pricing → click donate → donation processed via service's designated platform (JustGiving/Every.org).

### Cross-Platform Freedom
Users can freely switch between `/justgiving/` and `/everyorg/` - no platform restrictions or "preferences" to manage.

## Development Workflow

### Quality Assurance
- **Lint & Type Check**: ALWAYS run lint and typecheck commands after implementation
- **Testing**: Check README or search codebase for testing approach - NEVER assume frameworks
- **Build Verification**: Ensure successful build before considering task complete

### Deployment Process
- **GitHub Flow**: All changes deployed via Git push to GitHub → Vercel
- **No Manual Deployment**: Never use manual deployment commands
- **Commit Guidelines**: NEVER commit changes unless explicitly requested by user

### File Organization
- **Database**: See `supabase/CLAUDE.md` for schema, migrations, and Supabase-specific guidelines
- **Frontend**: See `src/CLAUDE.md` for component patterns, internationalization, and UI development
- **Documentation**: Updated README files contain detailed implementation guides

## Code Standards

### Following Conventions
When making changes to files, first understand the file's code conventions:
- **Library Verification**: Check that codebase already uses required libraries (package.json, cargo.toml)
- **Component Patterns**: Look at existing components for framework choice, naming, typing conventions
- **Context Awareness**: Check surrounding code imports and framework usage before making changes
- **Security First**: Never introduce code that exposes/logs secrets, never commit secrets to repository

### Internationalization
- **next-intl Integration**: All user-facing text must use translation keys
- **17 Language Support**: Complete localization across supported languages
- **Localized URLs**: Services and entity URLs properly translated with fallback system

### Component Guidelines
- **Split by Pain**: Create components when existing ones become difficult to work with
- **Mimic Patterns**: Follow existing code style, libraries, and patterns
- **Security Focus**: Always follow security best practices