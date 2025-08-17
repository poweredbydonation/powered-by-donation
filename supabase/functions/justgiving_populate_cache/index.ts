// JustGiving Cache Population Edge Function
// Populates organization_cache with JustGiving charity data using existing charity names table
// Runs as scheduled cron job (daily 2 AM UTC)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Known high-impact charity IDs to prioritize
const PRIORITY_CHARITY_IDS = [2050, 183092, 2357, 2423];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isRegisteredCharity(charity: any): boolean {
  const regNum = charity.registrationNumber;
  if (!regNum || regNum.trim() === '') {
    return false;
  }
  const nonRegisteredPatterns = [
    /^n\/a$/i, /^none$/i, /^not applicable$/i, /^pending$/i, /^temp/i, /^test/i
  ];
  for (const pattern of nonRegisteredPatterns) {
    if (pattern.test(regNum.trim())) {
      return false;
    }
  }
  return /[a-zA-Z0-9]/.test(regNum.trim());
}

// Search JustGiving API for a specific charity name
async function searchJustGivingByName(charityName: string, apiKey: string) {
  const url = `https://api.staging.justgiving.com/${apiKey}/v1/charity/search?q=${encodeURIComponent(charityName)}&pageSize=20&page=1`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });
    
    if (!response.ok) {
      console.error(`JustGiving search failed for "${charityName}": ${response.status}`);
      if (response.status === 429) {
        // Rate limited - wait and retry once
        await new Promise(resolve => setTimeout(resolve, 3000));
        const retryResponse = await fetch(url, {
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000)
        });
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          return retryData.charitySearchResults || [];
        }
      }
      return [];
    }
    
    const data = await response.json();
    return data.charitySearchResults || [];
    
  } catch (error) {
    console.warn(`⏰ Error/timeout searching for "${charityName}":`, error.message);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const justGivingApiKey = Deno.env.get('JUSTGIVING_API_KEY');
    
    if (!justGivingApiKey) {
      throw new Error('JUSTGIVING_API_KEY environment variable is required');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🚀 Starting JustGiving charity cache population using charity names table...');
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let foundInSearch = 0;
    let notFoundInSearch = 0;
    let registeredFound = 0;
    let nonRegisteredSkipped = 0;
    let duplicatesSkipped = 0;
    let alreadyCached = 0;
    let errors = [];
    
    const startTime = Date.now();
    const maxExecutionTime = 9 * 60 * 1000; // 9 minutes total
    const BATCH_SIZE = 100; // Process 100 charity names per run
    
    // Get next batch of unprocessed charity names
    const { data: charityNames, error: fetchError } = await supabase
      .from('JustGivingCharityNames')
      .select('Charity_Name, query_datetime, charity_id, add_to_cache_date')
      .is('query_datetime', null) // Not yet queried
      .order('Charity_Name')
      .limit(BATCH_SIZE);
    
    if (fetchError) {
      throw new Error(`Failed to fetch charity names: ${fetchError.message}`);
    }
    
    if (!charityNames || charityNames.length === 0) {
      console.log('✅ No unprocessed charity names found. All names have been queried.');
      return new Response(JSON.stringify({
        success: true,
        message: 'No unprocessed charity names found',
        totalProcessed: 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    console.log(`📋 Found ${charityNames.length} unprocessed charity names to query`);
    
    // Track processed charity IDs to avoid duplicates within this run
    const processedCharityIds = new Set();
    
    for (const charityNameRow of charityNames) {
      const charityName = charityNameRow.Charity_Name;
      const timeRemaining = maxExecutionTime - (Date.now() - startTime);
      
      // Stop if less than 30 seconds remaining
      if (timeRemaining < 30000) {
        console.warn(`⏰ Stopping at "${charityName}" - only ${Math.round(timeRemaining/1000)}s remaining`);
        break;
      }
      
      try {
        totalProcessed++;
        console.log(`🔍 [${totalProcessed}/${charityNames.length}] Searching: "${charityName}" (${Math.round(timeRemaining/1000)}s remaining)`);
        
        // Update query_datetime to mark this name as being processed
        await supabase
          .from('JustGivingCharityNames')
          .update({ query_datetime: new Date().toISOString() })
          .eq('Charity_Name', charityName);
        
        // Search JustGiving API for this charity name
        const searchResults = await searchJustGivingByName(charityName, justGivingApiKey);
        
        if (searchResults.length === 0) {
          console.log(`❌ No search results for: "${charityName}"`);
          notFoundInSearch++;
          // query_datetime is already set, charity_id remains null
          continue;
        }
        
        console.log(`✅ Found ${searchResults.length} search results for: "${charityName}"`);
        foundInSearch++;
        
        // Process search results - find best match (exact name match preferred)
        let bestMatch = null;
        let exactMatch = null;
        
        for (const charity of searchResults) {
          if (!charity || !charity.charityId || !charity.name) continue;
          
          // Look for exact name match first
          if (charity.name.toLowerCase().trim() === charityName.toLowerCase().trim()) {
            exactMatch = charity;
            break;
          }
          
          // Otherwise, take first valid charity as best match
          if (!bestMatch) {
            bestMatch = charity;
          }
        }
        
        const selectedCharity = exactMatch || bestMatch;
        
        if (!selectedCharity) {
          console.log(`❌ No valid charities in search results for: "${charityName}"`);
          notFoundInSearch++;
          continue;
        }
        
        // Update JustGivingCharityNames with found charity_id
        await supabase
          .from('JustGivingCharityNames')
          .update({ charity_id: selectedCharity.charityId })
          .eq('Charity_Name', charityName);
        
        console.log(`🎯 Selected charity: "${selectedCharity.name}" (ID: ${selectedCharity.charityId})`);
        
        // Skip if we've already processed this charity ID in this run
        if (processedCharityIds.has(selectedCharity.charityId)) {
          duplicatesSkipped++;
          console.log(`⏭️ Skipping duplicate charity ID: ${selectedCharity.charityId}`);
          continue;
        }
        
        processedCharityIds.add(selectedCharity.charityId);
        
        // Check if charity is already in organization_cache
        const { data: existingCharity } = await supabase
          .from('organization_cache')
          .select('external_id')
          .eq('platform', 'justgiving')
          .eq('external_id', selectedCharity.charityId.toString())
          .single();
        
        if (existingCharity) {
          alreadyCached++;
          console.log(`✅ Charity already cached: "${selectedCharity.name}"`);
          
          // Update add_to_cache_date since it's already cached
          await supabase
            .from('JustGivingCharityNames')
            .update({ add_to_cache_date: new Date().toISOString() })
            .eq('Charity_Name', charityName);
          
          continue;
        }
        
        // Filter: Only registered charities
        if (!isRegisteredCharity(selectedCharity)) {
          nonRegisteredSkipped++;
          console.log(`⏭️ Skipping non-registered charity: "${selectedCharity.name}"`);
          continue;
        }
        
        registeredFound++;
        const slug = generateSlug(selectedCharity.name);
        
        // Insert to unified organization cache
        const { error: insertError } = await supabase
          .from('organization_cache')
          .upsert({
            platform: 'justgiving',
            external_id: selectedCharity.charityId.toString(),
            name: selectedCharity.name,
            description: selectedCharity.description || null,
            logo_url: selectedCharity.logoAbsoluteUrl || null,
            slug: slug,
            category: selectedCharity.categories?.[0]?.category || null,
            is_active: true,
            is_featured: PRIORITY_CHARITY_IDS.includes(selectedCharity.charityId),
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'platform,external_id',
            ignoreDuplicates: false
          });
        
        if (insertError) {
          console.error(`❌ Error caching charity "${selectedCharity.name}":`, insertError);
          errors.push(`Failed to cache ${selectedCharity.name}: ${insertError.message}`);
        } else {
          totalInserted++;
          console.log(`✅ Successfully cached: "${selectedCharity.name}" (${selectedCharity.registrationNumber})`);
          
          // Update add_to_cache_date to mark successful caching
          await supabase
            .from('JustGivingCharityNames')
            .update({ add_to_cache_date: new Date().toISOString() })
            .eq('Charity_Name', charityName);
        }
        
        // Small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (charityError) {
        console.error(`❌ Error processing charity "${charityName}":`, charityError);
        errors.push(`Failed to process ${charityName}: ${charityError instanceof Error ? charityError.message : 'Unknown error'}`);
      }
    }
    
    const results = {
      success: true,
      message: 'JustGiving charity cache population completed',
      totalProcessed,
      foundInSearch,
      notFoundInSearch,
      registeredFound,
      nonRegisteredSkipped,
      duplicatesSkipped,
      alreadyCached,
      totalInserted,
      batchSize: BATCH_SIZE,
      errors: errors.slice(0, 10),
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    console.log('🎉 JustGiving charity cache population completed:', results);
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ JustGiving charity population failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'JustGiving charity population failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});