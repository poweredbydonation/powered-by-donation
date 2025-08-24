# Supabase Development Guide - Powered by Donation

## Database Architecture

### Unified User System
Single `users` table supporting both fundraiser and donor roles with happiness-based reputation metrics. See [README-database.md](../README-database.md) for complete schema details.

### Service Management & Quality System

#### Mutual Happiness Feedback
Both fundraisers and donors rate each service interaction with simple happy/unhappy ratings. This creates:
- **Quality control** through happiness metrics and filtering
- **Service access requirements** based on reputation scores  
- **Balanced feedback** maintaining donor-centric approach

#### Service Features
- **Fixed donation amounts** (e.g., exactly $50, not minimum or variable)
- **Charity requirements** ("any charity" or "specific charities")
- **Availability management** (date ranges and capacity limits)
- **Location flexibility** (physical, remote, or hybrid delivery)

## Dual Platform Architecture

### Platform Support
- **JustGiving**: Live platform with 1737+ charities
- **Every.org**: Phase 2 integration (placeholder implemented)

### Sequential Reference System
- **JustGiving**: PD-JG-1000, PD-JG-1001, PD-JG-1002...
- **Every.org**: PD-EV-1000, PD-EV-1001, PD-EV-1002...

### Database Tables

#### Core Tables
- `users`: Unified user system (fundraisers + donors)
- `services`: Service listings with platform awareness
- `service_requests`: Donation tracking with platform-specific references

#### Platform-Specific Cache Tables
- `justgiving_charity_cache`: JustGiving charity data (auto-populated)
- `every_org_nonprofit_cache`: Every.org nonprofit data (Phase 2)

#### Reference Generation
```sql
-- Platform-specific sequences
donation_reference_jg_seq
donation_reference_ev_seq

-- Reference generation function
generate_platform_reference(platform_name text, sequence_name text)
```

## Migration Management

### Current Migrations
1. `001_current_schema.sql`: Complete schema with dual platform support
2. `002_dual_platform_references.sql`: Sequential reference system
3. `012_setup_cron_polling.sql`: Automated donation status checking

### Migration Best Practices
- **Test locally**: Always test migrations in local Supabase before production
- **Backup critical data**: Use pg_dump before major schema changes
- **Sequential naming**: Use numbered prefixes for migration order
- **Rollback planning**: Include rollback instructions in migration comments

## Edge Functions

### check-donations
- **Purpose**: Automated donation status polling via JustGiving API
- **Schedule**: Every 5 minutes via pg_cron
- **Features**: Status updates, fundraiser notifications, timeout handling

### populate-justgiving-charity-cache
- **Purpose**: Daily charity data synchronization from JustGiving API
- **Schedule**: Daily at 2 AM UTC
- **Coverage**: Comprehensive A-Z charity population (1737+ charities)

### fetch-enhanced-charity-details
- **Purpose**: Enhanced charity data fetching using GetCharityById API
- **Schedule**: Every 30 minutes via pg_cron
- **Batch Size**: 20 charities per run
- **Features**: Address, contact details, impact statements, branding data
- **Completion**: Processes all charities in ~4 days

## Filter Lookup Tables System

### SQL-Based Lookup Table Population
- **Function**: `populate_lookup_tables_direct()` - Direct SQL function for filter data
- **Schedule**: Daily at 3 AM UTC via pg_cron job `populate-lookup-tables-sql`
- **Replaces**: Deprecated Edge Function `populate_filter_lookup_tables` (removed)
- **Filter**: Only includes organizations with `show_on_platform = true`
- **Performance**: ~10x faster than Edge Function approach using direct SQL
- **Migration**: `20250823221500_setup_sql_cron_lookup_tables.sql` applied the transition

### Lookup Tables
- **JustGiving**: `justgiving_cities_lookup`, `justgiving_countries_lookup`
- **ACNC**: `acnc_categories_lookup`, `acnc_cities_lookup`, `acnc_states_lookup`, `acnc_purposes_lookup`, `acnc_beneficiaries_lookup`, `acnc_operating_countries_lookup`
- **Every.org**: `everyorg_categories_lookup`

## API Integration

### JustGiving Integration
```typescript
// Environment Variables
NEXT_PUBLIC_JUSTGIVING_CHARITY_CHECKOUT_URL: Override staging URL
NEXT_PUBLIC_APP_URL: Base URL for donation returns
JUSTGIVING_API_KEY: API access (defaults to staging key)

// URL Format
https://link.staging.justgiving.com/v1/charity/donate/charityId/{id}?
donationValue={amount}&
currency=GBP&
exiturl={returnUrl}&
reference={serviceReference}&
skipGiftAid=true
```

### Key Features
- **Staging Environment**: Uses staging.justgiving.com for testing
- **Fixed Amounts**: Exact donation values, not minimums
- **Localized Returns**: Redirects to `/[locale]/donation-success`
- **Donation Tracking**: JustGiving provides `jgDonationId` for confirmation
- **International Support**: `skipGiftAid=true` for non-UK donors

## Security & Privacy

### Row Level Security (RLS)
All tables use RLS policies for data protection:
- **Users**: Can only access own profile data
- **Services**: Public read, owner write
- **Service Requests**: Private to fundraiser and donor involved

### Privacy Implementation
- **Anonymous Statistics**: All public displays aggregate-only
- **Optional Recognition**: Users control visibility preferences  
- **Data Retention**: Soft deletes preserve donation history

## Performance Optimization

### Indexing Strategy
- **Primary Keys**: UUID with proper indexing
- **Search Fields**: GIN indexes on text search columns
- **Foreign Keys**: Proper constraints and cascading
- **Composite Indexes**: Multi-column indexes for common queries
- **JSONB Optimization**: Platform-specific GIN indexes for categories, purposes, and beneficiaries
- **Query Condition Matching**: All indexes include `show_on_platform = true` for optimal performance

### Advanced Database Optimization (August 2024)
- **Every.org Categories**: GIN index on `categories_list` with multi-select AND filtering support
- **ACNC Purposes**: Optimized GIN index on `acnc_purposes` for sub-second filtering performance
- **ACNC Beneficiaries**: Optimized GIN index on `acnc_beneficiaries` for sub-second filtering performance
- **State Operations**: Composite indexes covering all Australian states with active/platform conditions
- **Performance Results**: All filtering operations now complete in < 1.5 seconds

### Caching
- **Charity Data**: Local cache tables reduce API calls
- **Static Queries**: Pre-computed views for performance
- **Edge Functions**: Efficient batch processing

## Development Workflow

### Local Development
1. **Setup**: `supabase start` (requires Docker)
2. **Migrations**: `supabase db reset` to apply all migrations
3. **Testing**: `supabase functions serve` for Edge Function testing
4. **Sync**: `supabase db pull` to sync remote changes

### Production Deployment
1. **Migration Apply**: `supabase db push` applies new migrations
2. **Function Deploy**: `supabase functions deploy [function-name]`
3. **Monitoring**: Use Supabase Dashboard for logs and metrics
4. **Backup**: Regular pg_dump backups via cron jobs

## Monitoring & Logging

### Key Metrics
- **Donation Success Rate**: Monitor pending→success conversion
- **API Response Times**: JustGiving API performance
- **Edge Function Execution**: Cron job success/failure rates
- **Database Performance**: Query execution times

### Error Handling
- **API Failures**: Graceful degradation with retry logic
- **Database Constraints**: Proper error messaging
- **Edge Function Timeouts**: Status tracking and recovery
- **Migration Failures**: Rollback procedures

## Current Project Status

### Completed Features
- ✅ Dual platform database schema
- ✅ Sequential reference generation (PD-JG-1000+)
- ✅ Automated donation status polling
- ✅ JustGiving charity cache (1737+ charities)
- ✅ Enhanced charity details system (GetCharityById API)
- ✅ Fundraiser notification system
- ✅ Database foreign key relationships

### M12 Every.org Integration (Phase 2 - In Progress)
- ✅ Every.org nonprofit cache table (existing schema)
- ✅ Every.org cache population edge function
- ✅ Automated cron job (daily 3 AM UTC)
- ✅ API endpoints for cached nonprofit access
- ⏳ Every.org webhook infrastructure (next session)
- ⏳ Cross-platform donation analytics
- ⏳ Enhanced reporting and insights

### Current Integration Status
- **JustGiving**: Live platform with 1737+ charities, full donation flow
- **Every.org**: Foundation complete - caching, search, browse system ready
- **Test Interface**: `/test-everyorg` validates 13 working categories with dynamic discovery