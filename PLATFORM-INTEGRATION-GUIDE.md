# Platform Integration Guide - Powered by Donation

## Overview

This guide provides step-by-step instructions for integrating a new donation platform (e.g., GoFundMe, DonateNow, etc.) into the Powered by Donation system. Following this guide ensures **single-push deployment** with no additional commits required.

**Example Integration**: Adding "gofundme" platform

## Prerequisites

- Platform API documentation and credentials
- Understanding of platform's organization/campaign structure
- Knowledge of platform's donation flow and webhook system
- Test account on the platform

## Phase 1: Database Schema Updates

### Step 1: Update Database Enum

**File**: `supabase/migrations/XXX_add_gofundme_platform.sql`

```sql
-- Add new platform to enum
ALTER TYPE donation_platform ADD VALUE 'gofundme';

-- Verify enum was updated
SELECT unnest(enum_range(NULL::donation_platform)) AS platform_values;
```

### Step 2: Update Edge Function Sequences (if needed)

```sql
-- Create platform-specific reference sequence
CREATE SEQUENCE IF NOT EXISTS donation_reference_gf_seq START 1000;

-- Update reference generation function
CREATE OR REPLACE FUNCTION generate_platform_reference(platform_name text)
RETURNS text AS $$
BEGIN
  CASE platform_name
    WHEN 'justgiving' THEN
      RETURN 'PD-JG-' || nextval('donation_reference_jg_seq');
    WHEN 'everyorg' THEN
      RETURN 'PD-EV-' || nextval('donation_reference_ev_seq');
    WHEN 'gofundme' THEN
      RETURN 'PD-GF-' || nextval('donation_reference_gf_seq');
    ELSE
      RAISE EXCEPTION 'Unknown platform: %', platform_name;
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

## Phase 2: TypeScript Type Updates

### Step 3: Update Core Types

**File**: `src/types/database.ts`

```typescript
// Line 29: Update DonationPlatform type
export type DonationPlatform = 'justgiving' | 'everyorg' | 'gofundme';
```

### Step 4: Update Platform Utilities

**File**: `src/lib/utils/platform-translations.ts`

```typescript
// Add platform-specific styling (lines 95-110)
export function getPlatformStyles(platform: DonationPlatform): {
  primary: string
  secondary: string
  badge: string
  button: string
} {
  if (platform === 'justgiving') {
    return {
      primary: 'text-blue-600',
      secondary: 'text-blue-700', 
      badge: 'bg-blue-100 text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  } else if (platform === 'everyorg') {
    return {
      primary: 'text-green-600',
      secondary: 'text-green-700',
      badge: 'bg-green-100 text-green-800', 
      button: 'bg-green-600 hover:bg-green-700 text-white'
    }
  } else if (platform === 'gofundme') {
    return {
      primary: 'text-purple-600',
      secondary: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800',
      button: 'bg-purple-600 hover:bg-purple-700 text-white'
    }
  }
  // Default fallback
  return {
    primary: 'text-gray-600',
    secondary: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800',
    button: 'bg-gray-600 hover:bg-gray-700 text-white'
  }
}
```

**File**: `src/lib/utils/entity-urls.ts`

```typescript
// Line 14: Add platform entity mapping
export const PLATFORM_ENTITY_TYPES: Record<DonationPlatform, EntityType> = {
  justgiving: 'charities',
  everyorg: 'nonprofits',
  gofundme: 'campaigns' // or 'fundraisers', depending on platform terminology
}

// Line 19: Add URL slug mapping
export const PLATFORM_ENTITY_SLUGS: Record<string, Record<DonationPlatform, string>> = {
  en: {
    justgiving: 'charities',
    everyorg: 'nonprofits',
    gofundme: 'campaigns'
  },
  tr: {
    justgiving: 'bagis-kuruluslari',
    everyorg: 'kar-amaci-gutmeyen-kuruluslar',
    gofundme: 'kampanyalar'
  },
  // Add other languages...
}
```

## Phase 3: Route Updates

### Step 5: Update Platform Validation

**File**: `src/app/[locale]/[platform]/page.tsx`

```typescript
// Line 19-21: Update validation function
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg', 'gofundme'].includes(platform)
}

// Line 39: Update static params
export function generateStaticParams() {
  const platforms: DonationPlatform[] = ['justgiving', 'everyorg', 'gofundme']
  
  return platforms.map((platform) => ({
    platform,
  }))
}

// Line 57-61: Update metadata
const platformNames = {
  justgiving: 'JustGiving',
  everyorg: 'Every.org',
  gofundme: 'GoFundMe'
}
```

**File**: `src/app/[locale]/[platform]/[entity_type]/page.tsx`

```typescript
// Line 35-37: Update validation (same as above)
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg', 'gofundme'].includes(platform)
}
```

**File**: `src/app/[locale]/[platform]/[entity_type]/[slug]/page.tsx`

```typescript
// Same validation update as above files
```

## Phase 4: API Integration

### Step 6: Create Platform API Client

**File**: `src/lib/gofundme/client.ts`

```typescript
/**
 * GoFundMe API Client
 * Handles organization search, details, and donation link generation
 */

export interface GoFundMeConfig {
  apiKey: string
  baseUrl: string
  apiVersion: string
}

export interface GoFundMeCampaign {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  url: string
  goal_amount: number
  current_amount: number
  location: string
}

export class GoFundMeClient {
  private config: GoFundMeConfig

  constructor(config: GoFundMeConfig) {
    this.config = config
  }

  async searchCampaigns(query: string, page: number = 1): Promise<GoFundMeCampaign[]> {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/search/campaigns`
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: '20'
    })

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`GoFundMe API error: ${response.status}`)
    }

    const data = await response.json()
    return data.campaigns || []
  }

  async getCampaign(campaignId: string): Promise<GoFundMeCampaign | null> {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/campaigns/${campaignId}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`GoFundMe API error: ${response.status}`)
    }

    return await response.json()
  }

  generateDonationUrl(campaignId: string, amount: number, reference: string): string {
    const params = new URLSearchParams({
      amount: amount.toString(),
      reference: reference,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/donation-success`
    })
    
    return `https://www.gofundme.com/mvc.php?route=donate2&term=${campaignId}&${params}`
  }
}

// Export configured client
export const gofundmeClient = new GoFundMeClient({
  apiKey: process.env.GOFUNDME_API_KEY!,
  baseUrl: process.env.GOFUNDME_API_BASE_URL || 'https://api.gofundme.com',
  apiVersion: 'v1'
})
```

### Step 7: Create API Routes

**File**: `src/app/api/gofundme/organizations/route.ts`

```typescript
/**
 * API Route: GoFundMe Organizations
 * Endpoint: /api/gofundme/organizations
 * Platform-specific organization fetching from unified organization_cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const featured = searchParams.get('featured') === 'true';
    const preferred = searchParams.get('preferred') === 'true';
    
    const supabase = createClient();
    
    let query = supabase
      .from('organization_cache')
      .select('*', { count: 'exact' })
      .eq('platform', 'gofundme')
      .eq('is_active', true);
    
    // Apply filters (same pattern as justgiving/everyorg)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,keywords.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (city && city !== 'all') {
      if (city === 'online') {
        query = query.eq('is_active', true);
      } else {
        query = query.eq('address_city', city);
      }
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }
    
    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    query = query
      .order('is_featured', { ascending: false })
      .order('total_donations_count', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data: organizations, error, count } = await query;
    
    if (error) {
      console.error('GoFundMe organizations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch GoFundMe organizations' }, { status: 500 });
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      organizations: organizations || [],
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: count || 0,
        has_next: page < totalPages,
        has_previous: page > 1
      },
      platform: 'gofundme'
    });
    
  } catch (error) {
    console.error('GoFundMe organizations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

**File**: `src/app/api/gofundme/campaigns/route.ts`

```typescript
/**
 * API Route: GoFundMe Campaigns Search
 * Endpoint: /api/gofundme/campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { gofundmeClient } from '@/lib/gofundme/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }
    
    const campaigns = await gofundmeClient.searchCampaigns(query, page);
    
    return NextResponse.json({
      campaigns,
      page,
      platform: 'gofundme'
    });
    
  } catch (error) {
    console.error('GoFundMe campaigns API error:', error);
    return NextResponse.json({ 
      error: 'Failed to search GoFundMe campaigns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

## Phase 5: Edge Functions

### Step 8: Create Cache Population Function

**File**: `supabase/functions/populate-gofundme-campaign-cache/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// GoFundMe campaign categories
const CAMPAIGN_CATEGORIES = [
  'medical', 'emergency', 'memorial', 'education', 'animals', 
  'community', 'sports', 'creative', 'travel', 'business'
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function searchGoFundMeCampaigns(category: string, apiKey: string, maxPages = 2) {
  const allCampaigns = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.gofundme.com/v1/search/campaigns?category=${category}&page=${page}&limit=20`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`GoFundMe API error for category ${category}, page ${page}:`, response.status);
        continue;
      }

      const data = await response.json();
      
      if (data.campaigns && Array.isArray(data.campaigns)) {
        allCampaigns.push(...data.campaigns);
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching GoFundMe campaigns for category ${category}, page ${page}:`, error);
    }
  }
  
  return allCampaigns;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const gofundmeApiKey = Deno.env.get('GOFUNDME_API_KEY');
    if (!gofundmeApiKey) {
      throw new Error('GOFUNDME_API_KEY environment variable is required');
    }

    console.log('Starting GoFundMe campaign cache population...');
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;

    // Process each category
    for (const category of CAMPAIGN_CATEGORIES) {
      console.log(`Processing category: ${category}`);
      
      const campaigns = await searchGoFundMeCampaigns(category, gofundmeApiKey);
      
      for (const campaign of campaigns) {
        try {
          const slug = generateSlug(campaign.title);
          
          const campaignData = {
            platform: 'gofundme',
            external_id: campaign.id.toString(),
            name: campaign.title,
            description: campaign.description || null,
            category: campaign.category || category,
            logo_url: campaign.image_url || null,
            slug: slug,
            website_url: campaign.url || null,
            address_city: campaign.location || null,
            is_active: true,
            last_updated: new Date().toISOString()
          };

          // Try to update existing record first
          const { data: existingCampaign } = await supabase
            .from('organization_cache')
            .select('id')
            .eq('platform', 'gofundme')
            .eq('external_id', campaign.id.toString())
            .single();

          if (existingCampaign) {
            // Update existing
            const { error: updateError } = await supabase
              .from('organization_cache')
              .update(campaignData)
              .eq('id', existingCampaign.id);

            if (updateError) {
              console.error(`Error updating campaign ${campaign.id}:`, updateError);
            } else {
              totalUpdated++;
            }
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('organization_cache')
              .insert(campaignData);

            if (insertError) {
              console.error(`Error inserting campaign ${campaign.id}:`, insertError);
            } else {
              totalInserted++;
            }
          }

          totalProcessed++;
          
        } catch (error) {
          console.error(`Error processing campaign ${campaign.id}:`, error);
        }
      }
      
      // Rate limiting between categories
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const result = {
      success: true,
      total_processed: totalProcessed,
      total_inserted: totalInserted,
      total_updated: totalUpdated,
      categories_processed: CAMPAIGN_CATEGORIES.length,
      timestamp: new Date().toISOString()
    };

    console.log('GoFundMe cache population completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('GoFundMe cache population error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Step 9: Create Donation Link Function

**File**: `supabase/functions/gofundme-create-donation-link/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { campaignId, amount, serviceId, userId } = await req.json();

    if (!campaignId || !amount || !serviceId || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: campaignId, amount, serviceId, userId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate platform-specific reference
    const { data: referenceData, error: refError } = await supabase
      .rpc('generate_platform_reference', { platform_name: 'gofundme' });

    if (refError) {
      throw new Error(`Failed to generate reference: ${refError.message}`);
    }

    const reference = referenceData;

    // Get campaign details
    const { data: campaign } = await supabase
      .from('organization_cache')
      .select('*')
      .eq('platform', 'gofundme')
      .eq('external_id', campaignId)
      .single();

    if (!campaign) {
      return new Response(JSON.stringify({ 
        error: 'Campaign not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate donation URL
    const donationUrl = `https://www.gofundme.com/mvc.php?route=donate2&term=${campaignId}` +
      `&amount=${amount}&reference=${reference}` +
      `&return_url=${encodeURIComponent(Deno.env.get('APP_URL') + '/donation-success')}`;

    // Create service request record
    const { error: insertError } = await supabase
      .from('service_requests')
      .insert({
        donor_id: userId,
        service_id: serviceId,
        platform: 'gofundme',
        reference_id: reference,
        organization_id: campaignId,
        organization_name: campaign.name,
        donation_url: donationUrl,
        donation_amount: amount,
        status: 'pending',
        timeout_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    if (insertError) {
      throw new Error(`Failed to create service request: ${insertError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      donation_url: donationUrl,
      reference: reference,
      campaign_name: campaign.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GoFundMe donation link creation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

## Phase 6: Component Updates

### Step 10: Update Platform-Specific Components

**File**: `src/components/services/PlatformRequirementsSelector.tsx`

```typescript
// Line 339: Update platform array
{(['justgiving', 'everyorg', 'gofundme'] as DonationPlatform[]).map(platform => {
```

**File**: `src/components/PlatformSelector.tsx` (if exists)

```typescript
// Update any hardcoded platform arrays to include 'gofundme'
const platforms = ['justgiving', 'everyorg', 'gofundme'] as const;
```

## Phase 7: Translation Updates

### Step 11: Add Translation Keys

**File**: `src/messages/en.json`

```json
{
  "platforms": {
    "gofundme": {
      "name": "GoFundMe",
      "entityType": {
        "singular": "campaign",
        "plural": "campaigns"
      },
      "browse": {
        "title": "Browse GoFundMe Campaigns",
        "description": "Discover campaigns and support causes through skill-based donations."
      }
    }
  }
}
```

**File**: `src/messages/tr.json`

```json
{
  "platforms": {
    "gofundme": {
      "name": "GoFundMe",
      "entityType": {
        "singular": "kampanya",
        "plural": "kampanyalar"
      },
      "browse": {
        "title": "GoFundMe Kampanyalarını Keşfet",
        "description": "Kampanyaları keşfedin ve beceri bazlı bağışlarla amaçları destekleyin."
      }
    }
  }
}
```

## Phase 8: Environment Variables

### Step 12: Add Environment Variables

**File**: `.env.local` (development)

```bash
# GoFundMe API Configuration
GOFUNDME_API_KEY=your_api_key_here
GOFUNDME_API_BASE_URL=https://api.gofundme.com
```

**Production**: Add these same variables to Vercel environment settings.

## Phase 9: Cron Job Setup

### Step 13: Add Cron Job

**File**: `supabase/migrations/XXX_setup_gofundme_cron.sql`

```sql
-- Setup cron job for GoFundMe cache population
SELECT cron.schedule(
  'populate-gofundme-campaign-cache',
  '0 4 * * *', -- Daily at 4 AM UTC
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/populate-gofundme-campaign-cache',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

## Phase 10: Testing & Validation

### Step 14: Pre-Deployment Checklist

**Database**:
- [ ] Enum updated with new platform value
- [ ] Reference sequence created
- [ ] Migration tested locally

**TypeScript**:
- [ ] No compilation errors
- [ ] All type definitions updated
- [ ] Platform validation functions updated

**Routes**:
- [ ] All dynamic routes accept new platform
- [ ] Static params generation includes new platform
- [ ] Metadata generation handles new platform

**API**:
- [ ] Platform-specific API routes created
- [ ] Client library implemented and tested
- [ ] Error handling for API failures

**Edge Functions**:
- [ ] Cache population function deployed
- [ ] Donation link creation function deployed
- [ ] Cron job scheduled

**Environment**:
- [ ] API keys configured in development
- [ ] Production environment variables set
- [ ] Edge function environment variables set

**UI**:
- [ ] Platform selector includes new platform
- [ ] Styling/branding applied
- [ ] Translation keys added

### Step 15: Test Scenarios

1. **Platform Browse**: Visit `/[locale]/gofundme/campaigns`
2. **Organization Search**: Test API endpoint `/api/gofundme/organizations`
3. **Service Creation**: Create service with GoFundMe campaigns
4. **Donation Flow**: Test donation link generation
5. **Cache Population**: Manually trigger edge function

## Deployment Commands

```bash
# 1. Database migration
pnpm supabase db push

# 2. Deploy edge functions
pnpm supabase functions deploy populate-gofundme-campaign-cache
pnpm supabase functions deploy gofundme-create-donation-link

# 3. Build and deploy frontend
pnpm build
git add .
git commit -m "feat: add GoFundMe platform integration

- Database enum updated with gofundme platform
- TypeScript types updated across codebase
- API routes and client library implemented
- Edge functions for cache population and donations
- UI components updated with platform support
- Translation keys added for localization
- Cron job scheduled for daily cache updates

🤖 Generated with Claude Code"
git push origin main
```

## Post-Deployment Verification

1. Visit platform pages: `/{locale}/gofundme/campaigns`
2. Test API endpoints in browser dev tools
3. Verify edge functions in Supabase dashboard
4. Check cron job execution logs
5. Test end-to-end donation flow

## Platform-Specific Customizations

### GoFundMe Specifics
- **Entity Type**: "campaigns" (not charities/nonprofits)
- **ID Field**: Campaign ID (string/number)
- **Categories**: Medical, Emergency, Memorial, etc.
- **Donation Flow**: Direct to campaign page with parameters
- **Verification**: No charity registration validation

### Future Platform Template
Use this guide as a template for additional platforms:
- Replace "gofundme" with new platform name
- Update API endpoints and authentication
- Modify data mapping for platform-specific fields
- Adjust validation rules for platform requirements
- Update styling/branding colors

---

**Time Estimate**: 4-6 hours for experienced developer
**Single Push**: Yes, if all steps completed before commit
**Testing Required**: Local testing before production deployment