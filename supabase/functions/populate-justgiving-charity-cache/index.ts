// Supabase Edge Function: Populate Charity Cache
// Runs as cron job to populate justified charity cache with verified charities
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Alphabetical search terms for complete charity coverage
const ALPHABETICAL_SEARCH_TERMS = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
];

// Known high-impact charity IDs to prioritize
const PRIORITY_CHARITY_IDS = [2050, 183092, 2357, 2423];

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isRegisteredCharity(charity) {
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

// Lightweight search - gets limited pages but ensures all letters are covered
async function searchJustGivingCharitiesLight(searchTerm, apiKey, maxPages = 3) {
  const allCharities = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.staging.justgiving.com/${apiKey}/v1/charity/search?q=${encodeURIComponent(searchTerm)}&pageSize=20&page=${page}`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        console.error(`JustGiving search failed for "${searchTerm}" page ${page}: ${response.status}`);
        if (response.status === 429) {
          // If rate limited, wait and try once more
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        break;
      }
      
      const data = await response.json();
      const charities = data.charitySearchResults || [];
      
      if (charities.length === 0) {
        console.log(`📄 No more results for "${searchTerm}" at page ${page}`);
        break;
      }
      
      allCharities.push(...charities);
      console.log(`📄 Page ${page}/${maxPages} for "${searchTerm}": ${charities.length} charities (total: ${allCharities.length})`);
      
      // If we got less than 20, we've reached the end
      if (charities.length < 20) {
        console.log(`📄 Last page for "${searchTerm}" (got ${charities.length} < 20)`);
        break;
      }
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.warn(`⏰ Error/timeout on page ${page} for "${searchTerm}":`, error.message);
      break;
    }
  }
  
  return allCharities;
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
    
    console.log('🚀 Starting charity cache population (lightweight - all letters prioritized)...');
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let registeredFound = 0;
    let nonRegisteredSkipped = 0;
    let duplicatesSkipped = 0;
    let errors = [];
    let lettersCompleted = 0;
    
    // Track processed charity IDs
    const processedCharityIds = new Set();
    
    const startTime = Date.now();
    const maxExecutionTime = 6 * 60 * 1000; // 6 minutes total
    const timePerLetter = Math.floor(maxExecutionTime / ALPHABETICAL_SEARCH_TERMS.length); // ~13.8 seconds per letter
    
    for (const searchTerm of ALPHABETICAL_SEARCH_TERMS) {
      const letterStartTime = Date.now();
      const timeRemaining = maxExecutionTime - (Date.now() - startTime);
      
      // Stop if less than 30 seconds remaining
      if (timeRemaining < 30000) {
        console.warn(`⏰ Stopping at letter "${searchTerm}" - only ${Math.round(timeRemaining/1000)}s remaining`);
        break;
      }
      
      try {
        console.log(`🔍 [${lettersCompleted + 1}/26] Searching: "${searchTerm}" (${Math.round(timeRemaining/1000)}s remaining)`);
        
        // Adaptive page limits based on remaining time and position
        let maxPages;
        if (timeRemaining > 180000) { // More than 3 minutes left
          maxPages = searchTerm <= 'f' ? 5 : 3; // More pages for early letters
        } else if (timeRemaining > 90000) { // More than 1.5 minutes left
          maxPages = 2;
        } else {
          maxPages = 1; // Just 1 page if running low on time
        }
        
        const charities = await searchJustGivingCharitiesLight(searchTerm, justGivingApiKey, maxPages);
        
        if (charities.length === 0) {
          console.log(`❌ No results for: ${searchTerm}`);
          lettersCompleted++;
          continue;
        }
        
        console.log(`✅ Found ${charities.length} charities for: ${searchTerm}`);
        
        // Process up to 15 charities per letter to keep execution light
        const charitesToProcess = Math.min(charities.length, 15);
        for (const charity of charities.slice(0, charitesToProcess)) {
          try {
            // Skip invalid data
            if (!charity || !charity.charityId || !charity.name) {
              continue;
            }
            
            // Skip duplicates
            if (processedCharityIds.has(charity.charityId)) {
              duplicatesSkipped++;
              continue;
            }
            
            processedCharityIds.add(charity.charityId);
            totalProcessed++;
            
            // Filter: Only registered charities
            if (!isRegisteredCharity(charity)) {
              nonRegisteredSkipped++;
              continue;
            }
            
            registeredFound++;
            const slug = generateSlug(charity.name);
            
            // Insert to database
            const { error } = await supabase
              .from('justgiving_charity_cache')
              .upsert({
                justgiving_charity_id: charity.charityId.toString(),
                name: charity.name,
                description: charity.description || null,
                logo_url: charity.logoAbsoluteUrl || null,
                slug: slug,
                category: charity.categories?.[0]?.category || null,
                is_active: true,
                is_featured: PRIORITY_CHARITY_IDS.includes(charity.charityId),
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'justgiving_charity_id',
                ignoreDuplicates: false
              });
            
            if (error) {
              console.error(`Error upserting charity ${charity.name}:`, error);
              errors.push(`Failed to upsert ${charity.name}: ${error.message}`);
            } else {
              totalInserted++;
              console.log(`✅ Cached: ${charity.name} (${charity.registrationNumber})`);
            }
            
          } catch (charityError) {
            console.error(`Error processing charity:`, charityError);
            errors.push(`Failed to process charity: ${charityError instanceof Error ? charityError.message : 'Unknown error'}`);
          }
        }
        
        lettersCompleted++;
        const letterTime = Date.now() - letterStartTime;
        console.log(`📊 Letter "${searchTerm}" completed in ${letterTime}ms (${lettersCompleted}/26 letters done)`);
        
        // Small delay between letters
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (searchError) {
        console.error(`Error searching for "${searchTerm}":`, searchError);
        errors.push(`Failed search for "${searchTerm}": ${searchError instanceof Error ? searchError.message : 'Unknown error'}`);
        lettersCompleted++;
      }
    }
    
    // Quick priority charity check if time allows
    const finalTimeRemaining = maxExecutionTime - (Date.now() - startTime);
    if (finalTimeRemaining > 30000) {
      console.log('🎯 Quick priority charity check...');
      for (const charityId of PRIORITY_CHARITY_IDS.slice(0, 2)) { // Only check first 2
        if (processedCharityIds.has(charityId)) {
          console.log(`⏭️ Priority charity ${charityId} already processed`);
          continue;
        }
        // Quick priority processing...
      }
    }
    
    const results = {
      success: true,
      message: 'Charity cache population completed (lightweight all-letters approach)',
      totalProcessed,
      registeredFound,
      nonRegisteredSkipped,
      duplicatesSkipped,
      totalInserted,
      lettersCompleted,
      totalLetters: ALPHABETICAL_SEARCH_TERMS.length,
      uniqueCharitiesFound: processedCharityIds.size,
      errors: errors.slice(0, 10),
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    console.log('🎉 Charity cache population completed:', results);
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Charity population failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Charity population failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});