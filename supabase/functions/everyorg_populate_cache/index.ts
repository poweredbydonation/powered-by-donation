// Every.org Cache Population Edge Function
// Populates organization_cache with Every.org nonprofit data using systematic cause browsing
// Runs as scheduled cron job (daily 3 AM UTC)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};
const EVERYORG_PUBLIC_KEY = Deno.env.get('EVERYORG_PUBLIC_KEY');
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
async function fetchEveryOrgNonprofits(cause, page = 1, pageSize = 50) {
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
function prepareNonprofitForCache(nonprofit) {
  // Extract slug from profileUrl if not provided
  const slug = nonprofit.slug || nonprofit.profileUrl?.split('/').pop() || nonprofit.ein || `unknown-${Date.now()}`;
  // EIN can be null for international nonprofits
  const nonprofitEin = nonprofit.ein || null;
  return {
    platform: 'everyorg',
    external_id: nonprofitEin || slug,
    name: nonprofit.name,
    description: nonprofit.description || '',
    category: nonprofit.tags?.[0] || 'general',
    categories_list: nonprofit.tags || [],
    logo_url: nonprofit.logoUrl,
    slug: slug,
    is_active: true,
    last_updated: new Date().toISOString()
  };
}
async function batchUpsertNonprofits(nonprofits, supabase) {
  try {
    const { error } = await supabase.from('organization_cache').upsert(nonprofits, {
      onConflict: 'platform,slug'
    });
    if (error) {
      console.error('Error batch upserting nonprofits:', error);
      return {
        success: 0,
        errors: nonprofits.length
      };
    } else {
      console.log(`Successfully batch cached ${nonprofits.length} nonprofits`);
      return {
        success: nonprofits.length,
        errors: 0
      };
    }
  } catch (error) {
    console.error('Error in batchUpsertNonprofits:', error);
    return {
      success: 0,
      errors: nonprofits.length
    };
  }
}
async function getProcessingState(supabase) {
  try {
    const { data, error } = await supabase.from('organization_cache').select('description').eq('platform', 'everyorg').eq('slug', 'progress-tracker').single();
    if (error || !data) {
      console.log('No existing progress tracker found, starting from beginning');
      return {
        causeIndex: 0,
        page: 1
      };
    }
    try {
      const progress = JSON.parse(data.description || '{}');
      return {
        causeIndex: progress.causeIndex || 0,
        page: progress.page || 1,
        cause: progress.cause
      };
    } catch (parseError) {
      console.error('Error parsing progress data, starting fresh');
      return {
        causeIndex: 0,
        page: 1
      };
    }
  } catch (error) {
    console.error('Error getting processing state:', error);
    return {
      causeIndex: 0,
      page: 1
    };
  }
}
async function saveProcessingState(causeIndex, page, cause, supabase, stats) {
  try {
    const progressData = {
      causeIndex,
      page,
      cause,
      lastRun: new Date().toISOString(),
      ...stats
    };
    const { error } = await supabase.from('organization_cache').upsert({
      platform: 'everyorg',
      external_id: '_progress_tracker',
      name: 'Processing Progress Tracker',
      description: JSON.stringify(progressData),
      last_updated: new Date().toISOString(),
      is_active: true,
      slug: 'progress-tracker'
    }, {
      onConflict: 'platform,slug'
    });
    if (error) {
      console.error('Error saving progress:', error);
    }
  } catch (error) {
    console.error('Exception saving progress:', error);
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (!EVERYORG_PUBLIC_KEY) {
    console.error('EVERYORG_PUBLIC_KEY environment variable not set');
    return new Response(JSON.stringify({
      error: 'Every.org API key not configured'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    console.log('Starting Every.org nonprofit cache population...');
    const supabase = createSupabaseClient();
    // Complete Every.org cause list for systematic processing
    const ALL_CAUSES = [
      'animals',
      'cats',
      'dogs',
      'wildlife',
      'culture',
      'visual-art',
      'dance',
      'filmandtv',
      'museums',
      'music',
      'theater',
      'education',
      'libraries',
      'scholarships',
      'environment',
      'agriculture',
      'climate',
      'conservation',
      'oceans',
      'parks',
      'health',
      'autism',
      'cancer',
      'disease',
      'mental-health',
      'womens-health',
      'humans',
      'adoption',
      'entrepreneurship',
      'food-security',
      'housing',
      'immigrants',
      'indigenous-peoples',
      'poverty',
      'refugees',
      'seniors',
      'veterans',
      'water',
      'youth',
      'justice',
      'aapi-led',
      'black-led',
      'disabilities',
      'freepress',
      'gender-equality',
      'indigenous-led',
      'latine-led',
      'legal',
      'lgbt',
      'racial-justice',
      'votingrights',
      'women-led',
      'religion',
      'buddhism',
      'christianity',
      'hinduism',
      'islam',
      'judaism',
      'research',
      'science',
      'space'
    ];
    // Get current processing state
    const state = await getProcessingState(supabase);
    let { causeIndex, page } = state;
    const startTime = Date.now();
    const MAX_RUNTIME_MS = 1.8 * 60 * 1000; // 1.8 minutes (conservative CPU limit)
    const MAX_REQUESTS_PER_RUN = 10; // Very conservative: process fewer pages per run
    let totalProcessed = 0;
    let totalErrors = 0;
    let requestCount = 0;
    let completed = false;
    console.log(`Resuming from cause index ${causeIndex} (${ALL_CAUSES[causeIndex] || 'COMPLETED'}), page ${page}`);
    // Process causes sequentially with much smaller batches
    while(causeIndex < ALL_CAUSES.length && Date.now() - startTime < MAX_RUNTIME_MS && requestCount < MAX_REQUESTS_PER_RUN){
      const cause = ALL_CAUSES[causeIndex];
      console.log(`Processing cause: ${cause}, page: ${page}`);
      const response = await fetchEveryOrgNonprofits(cause, page, 50); // Smaller page size
      requestCount++;
      if (!response || !response.nonprofits?.length) {
        console.log(`No more nonprofits for cause: ${cause}, moving to next cause`);
        causeIndex++;
        page = 1;
        continue;
      }
      // Prepare all nonprofits for batch insert
      const nonprofitsToCache = [];
      for (const nonprofit of response.nonprofits){
        try {
          const prepared = prepareNonprofitForCache(nonprofit);
          nonprofitsToCache.push(prepared);
        } catch (error) {
          console.error(`Error preparing nonprofit ${nonprofit.name}:`, error);
          totalErrors++;
        }
      }
      // Batch upsert all nonprofits from this page
      if (nonprofitsToCache.length > 0) {
        const result = await batchUpsertNonprofits(nonprofitsToCache, supabase);
        totalProcessed += result.success;
        totalErrors += result.errors;
      }
      console.log(`Processed page ${page} of cause ${cause}: ${response.nonprofits.length} nonprofits`);
      // Check if more pages exist for this cause
      if (page < response.pagination.pages) {
        page++;
      } else {
        // Move to next cause
        console.log(`Completed cause: ${cause} (${response.pagination.total_results} total nonprofits)`);
        causeIndex++;
        page = 1;
      }
      // Rate limiting: slower processing to stay within CPU limits
      await new Promise((resolve)=>setTimeout(resolve, 300));
    }
    // Check if we've completed all causes
    completed = causeIndex >= ALL_CAUSES.length;
    // Save current progress
    const stats = {
      totalProcessed,
      totalErrors,
      requestCount,
      completed,
      remainingCauses: ALL_CAUSES.length - causeIndex
    };
    const currentCause = causeIndex < ALL_CAUSES.length ? ALL_CAUSES[causeIndex] : 'COMPLETED';
    await saveProcessingState(causeIndex, page, currentCause, supabase, stats);
    const summary = {
      success: true,
      total_processed: totalProcessed,
      total_errors: totalErrors,
      requests_made: requestCount,
      current_cause: currentCause,
      current_page: page,
      progress: `${causeIndex}/${ALL_CAUSES.length} causes`,
      completed,
      timestamp: new Date().toISOString(),
      next_run: completed ? 'Processing complete!' : 'Will resume in next cron run'
    };
    console.log('Every.org systematic population run completed:', summary);
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Unexpected error during cache population:', error);
    return new Response(JSON.stringify({
      error: 'Cache population failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
