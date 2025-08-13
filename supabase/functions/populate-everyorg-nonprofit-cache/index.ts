import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// NOTE: Environment variables may not work consistently in Supabase Edge Functions
// If EVERYORG_PUBLIC_KEY env var fails, hardcode the API key directly in Supabase Dashboard
const EVERYORG_PUBLIC_KEY = Deno.env.get('EVERYORG_PUBLIC_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  description: string;
  logoUrl?: string;
  slug?: string;
  profileUrl: string;
  websiteUrl?: string;
  locationAddress?: string;
  tags?: string[];
}

interface EveryOrgBrowseResponse {
  nonprofits: EveryOrgNonprofit[];
  pagination: {
    page: number;
    pages: number;
    page_size: number;
    total_results: number;
  };
}

async function fetchEveryOrgNonprofits(cause: string, page: number = 1, pageSize: number = 50): Promise<EveryOrgBrowseResponse | null> {
  try {
    const url = `https://partners.every.org/v0.2/browse/${cause}?apiKey=${EVERYORG_PUBLIC_KEY}&take=${pageSize}&page=${page}`;
    console.log(`Fetching Every.org nonprofits for cause: ${cause}, page: ${page}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Every.org API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Every.org nonprofits:', error);
    return null;
  }
}

async function upsertNonprofitToCache(nonprofit: EveryOrgNonprofit): Promise<void> {
  try {
    // Extract slug from profileUrl if not provided
    const slug = nonprofit.slug || nonprofit.profileUrl.split('/').pop() || nonprofit.ein || `unknown-${Date.now()}`;
    
    // EIN can be null for international nonprofits
    const nonprofitEin = nonprofit.ein || null;
    
    const { error } = await supabase
      .from('organization_cache')
      .upsert({
        platform: 'everyorg',
        external_id: nonprofitEin || slug, // Use EIN if available, otherwise slug
        name: nonprofit.name,
        description: nonprofit.description || '',
        category: nonprofit.tags?.[0] || 'general',
        logo_url: nonprofit.logoUrl,
        slug: slug,
        is_active: true,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'platform,external_id'
      });
    
    if (error) {
      console.error('Error upserting nonprofit to cache:', error);
    } else {
      console.log(`Successfully cached nonprofit: ${nonprofit.name} (${nonprofitEin || 'no EIN'})`);
    }
  } catch (error) {
    console.error('Error in upsertNonprofitToCache:', error);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!EVERYORG_PUBLIC_KEY) {
    console.error('EVERYORG_PUBLIC_KEY environment variable not set');
    return new Response(
      JSON.stringify({ error: 'Every.org API key not configured' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('Starting Every.org nonprofit cache population...');
    
    // Popular causes to populate
    const causes = [
      'animals', 'environment', 'humans', 'health', 'education',
      'arts', 'community', 'disaster', 'veterans', 'research'
    ];
    
    let totalProcessed = 0;
    let totalErrors = 0;
    const results: { [key: string]: number } = {};
    
    for (const cause of causes) {
      console.log(`Processing cause: ${cause}`);
      let processed = 0;
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 5) { // Limit to 5 pages per cause to avoid timeouts
        const response = await fetchEveryOrgNonprofits(cause, page);
        
        if (!response || !response.nonprofits.length) {
          console.log(`No more nonprofits found for cause: ${cause}, page: ${page}`);
          break;
        }
        
        // Process nonprofits in batches
        for (const nonprofit of response.nonprofits) {
          try {
            await upsertNonprofitToCache(nonprofit);
            processed++;
            totalProcessed++;
          } catch (error) {
            console.error(`Error processing nonprofit ${nonprofit.name}:`, error);
            totalErrors++;
          }
        }
        
        // Check if there are more pages
        hasMore = page < response.pagination.pages;
        page++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      results[cause] = processed;
      console.log(`Completed cause: ${cause}, processed: ${processed} nonprofits`);
    }
    
    // Update cache statistics
    const { error: statsError } = await supabase
      .from('organization_cache')
      .update({ stats_last_updated: new Date().toISOString() })
      .eq('platform', 'everyorg')
      .eq('is_active', true);
    
    if (statsError) {
      console.error('Error updating cache statistics:', statsError);
    }
    
    const summary = {
      success: true,
      total_processed: totalProcessed,
      total_errors: totalErrors,
      results_by_cause: results,
      timestamp: new Date().toISOString()
    };
    
    console.log('Every.org nonprofit cache population completed:', summary);
    
    return new Response(
      JSON.stringify(summary),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Unexpected error during cache population:', error);
    return new Response(
      JSON.stringify({
        error: 'Cache population failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});