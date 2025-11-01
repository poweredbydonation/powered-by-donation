# Supabase Database Reference

This directory contains SQL files for database functions, policies, views, and migrations used in the Powered by Donation platform.

## Directory Structure

```
supabase/
├── functions/          # Database functions (stored procedures)
├── migrations/         # Database schema migrations
├── policies/          # Row Level Security (RLS) policies
├── views/             # Database views for public data access
└── README.md          # This file
```

## Database Functions

### Happiness Functions (`functions/001_happiness_functions.sql`)
- `calculate_fundraiser_happiness(uuid)` - Calculate happiness metrics for fundraisers
- `calculate_donor_happiness(uuid)` - Calculate happiness metrics for donors  
- `calculate_service_happiness(uuid)` - Calculate service quality ratings
- `trigger_update_happiness_metrics()` - Trigger function for automatic updates

### Charity Functions (`functions/002_charity_functions.sql`)
- `get_charity_public_stats(text)` - Get public charity statistics
- `increment_charity_stats(text, numeric, text)` - Update charity donation stats
- `reset_monthly_charity_stats()` - Reset monthly statistics (cron job)

## Row Level Security Policies

### RLS Policies (`policies/001_rls_policies.sql`)
Complete set of Row Level Security policies for:
- **Users** - Profile access control
- **Services** - Service visibility and management
- **Service Requests** - Donor/fundraiser request access
- **Charity Cache** - Public charity data access
- **Pricing Tiers** - Public pricing access

## Database Views

### Public Views (`views/001_public_views.sql`)
Anonymous aggregate views for public platform statistics:
- `public_platform_stats` - Overall platform metrics
- `public_donation_activity` - Recent donation activity (anonymous)
- `public_fundraiser_activity` - Fundraiser activity metrics
- `public_charity_impact` - Charity impact statistics

## Migrations

### Current Schema (`migrations/001_current_schema.sql`)
Complete database schema including:
- All table definitions with fundraiser/donor terminology
- Indexes and constraints
- RLS policies and functions
- Comments and documentation

## Terminology Update

The database has been updated from provider/supporter terminology to fundraiser/donor:

**Old Terms → New Terms:**
- `provider_id` → `fundraiser_id`
- `supporter_id` → `donor_id`
- `is_provider` → `is_fundraiser`
- `is_supporter` → `is_donor`
- `provider_rates_supporter` → `fundraiser_rates_donor`
- `supporter_rates_provider` → `donor_rates_fundraiser`
- `supporter_rates_service` → `donor_rates_service`
- And many more...

## Privacy Model

The database implements an **Anonymous + Aggregate + Optional Sharing** privacy model:

- **Always Anonymous**: No public donor names or persistent identities
- **Aggregate Statistics**: Platform activity shown in totals only
- **Optional Recognition**: Users choose when to get personal credit
- **Private Connections**: Donor names shared with fundraisers & charities only

## Usage Notes

1. **Apply functions first**: Run function files before policies
2. **Test policies**: Verify RLS policies work correctly after applying
3. **Grant permissions**: Ensure public views have correct access grants
4. **Monitor performance**: Index usage on happiness calculation functions

## Development

When making database changes:

1. Update the appropriate SQL files in this directory
2. Test changes on a staging database first
3. Apply changes to production via Supabase dashboard
4. Update this documentation as needed

---

**Contact**: MEHMET AKIF ALTUNDAL | contact@poweredbydonation.com | NSW, Australia