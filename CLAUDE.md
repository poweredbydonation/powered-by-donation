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

## Documentation Structure

This CLAUDE.md file provides a high-level overview. For detailed information, see the specialized documentation:

- **Architecture & Infrastructure**: `docs/CLAUDE.md` - Technical stack, database architecture, component structure
- **Development Guidelines**: `development/CLAUDE.md` - Development principles, workflows, and coding standards
- **Project Status**: `project-status/CLAUDE.md` - Current status, completed features, and progress tracking
- **Branding Guidelines**: `branding/CLAUDE.md` - Platform-specific branding, visual guidelines, and implementation standards
- **Database**: `supabase/CLAUDE.md` - Schema, migrations, and Supabase-specific guidelines
- **Frontend**: `src/CLAUDE.md` - Component patterns, internationalization, and UI development
- **Service Workflow**: `workflow/CLAUDE.md` - Service request workflow system, state management, and donor-fundraiser interactions

## Quick Reference

### Technical Stack
```
Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + next-intl
Backend: Supabase (database, auth, edge functions)
Deployment: GitHub → Vercel (automated deployment)
Package Manager: pnpm (NEVER use npm)
Internationalization: next-intl with 17 language support
```

### Essential Principles
1. **pnpm only** - Never suggest npm commands
2. **Anonymous always** - No public donor names, identities, or tracking  
3. **Fixed pricing** - Services have exact donation amounts (never minimum/variable)
4. **Platform-first architecture** - Multi-platform with context-driven actions
5. **Component splitting** - Split by pain, not by arbitrary rules
6. **Performance first** - Server-side filtering, pagination, strategic indexing

### Development Workflow
- **Quality Assurance**: Always run lint and typecheck commands after implementation
- **Security First**: Never expose/log secrets, never commit secrets to repository
- **GitHub Deployment**: All changes via Git push, not manual commands
- **Documentation**: Refer to specialized CLAUDE.md files in subdirectories

## Current Status Summary

**Platform-First Restructuring**: Complete - Core architecture fully implemented with unified data system
**Performance Optimization**: Complete - Eliminated expensive queries, implemented caching system  
**Multi-Platform Integration**: Complete - JustGiving, Every.org, and ACNC fully integrated
**Branding Systems**: Complete - Platform-specific theming and official brand guidelines implemented
**Service Workflow System**: Complete - Full service request workflow with automated state management, real-time notifications, and comprehensive feedback system
**Personal Services Management**: Complete - Full-width mobile-responsive personal services dashboard with management controls
**Dynamic Routing System**: Complete - Unified `/[locale]/[platform]/[entity_type]` routing with personal platform support
**User Role System**: Simplified - Removed role selection, all users have both fundraiser and donor capabilities
**Navigation System**: Enhanced - Added service requests menu item, updated profile dropdown

Recent Updates:
- Converted static routes to dynamic platform system (`/my/services` → `/[locale]/[platform]/[entity_type]`)
- Added `service_requests` entity type with localized URL slugs
- Removed user role selection - all users are both fundraisers and donors
- Enhanced navigation with service requests menu item
- Unified services page with proper card display and creation flow
- **Analytics Integration**: Added Vercel Analytics for comprehensive user behavior tracking
- **ESLint Configuration**: Updated to allow unescaped entities in JSX (safe React practice)

For detailed status information, progress tracking, and implementation history, see `project-status/CLAUDE.md`.

---

**Contact**: MEHMET AKIF ALTUNDAL | contact@poweredbydonation.com | NSW, Australia