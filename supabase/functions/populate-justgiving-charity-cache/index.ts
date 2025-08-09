// Supabase Edge Function: Populate Charity Cache
// Runs as cron job to populate justified charity cache with verified charities

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JustGivingCharity {
  charityId: number;
  name: string;
  description?: string;
  logoAbsoluteUrl?: string;
  profilePageUrl?: string;
  categories?: Array<{ category: string }>;
}

interface JustGivingSearchResponse {
  charities?: JustGivingCharity[];
  next?: string;
}

// High-priority verified charity search terms (focused on popular/verified charities)
const VERIFIED_CHARITY_SEARCHES = [
  // Major UK Charities (verified)
  'cancer research uk',
  'british heart foundation', 
  'oxfam',
  'save the children',
  'macmillan cancer support',
  'british red cross',
  'wwf',
  'rspca',
  'mencap',
  'scope',
  
  // Major Health Charities
  'marie curie',
  'alzheimer society',
  'diabetes uk',
  'parkinsons uk',
  'stroke association',
  
  // Children's Charities
  'barnardos',
  'nspcc',
  'great ormond street',
  'make a wish',
  'children in need',
  
  // International Aid
  'unicef',
  'world vision',
  'christian aid',
  'tearfund',
  'plan international'
];

// Known high-impact charity IDs to prioritize
const PRIORITY_CHARITY_IDS = [
  2050,    // The Demo Charity (for testing)
  183092,  // British Heart Foundation
  2357,    // Example charity
  2423,    // Example charity
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

async function searchJustGivingCharities(searchTerm: string, apiKey: string): Promise<JustGivingCharity[]> {
  const url = `https://api.staging.justgiving.com/v1/charity/search?q=${encodeURIComponent(searchTerm)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`JustGiving search failed for "${searchTerm}": ${response.status} ${response.statusText}`);
      return [];
    }

    const data: JustGivingSearchResponse = await response.json();
    return data.charities || [];
  } catch (error) {
    console.error(`Error searching JustGiving for "${searchTerm}":`, error);
    return [];
  }
}

async function getCharityDetails(charityId: number, apiKey: string): Promise<JustGivingCharity | null> {
  const url = `https://api.staging.justgiving.com/v1/charity/${charityId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`JustGiving charity details failed for ${charityId}: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting charity details for ${charityId}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const justGivingApiKey = Deno.env.get('JUSTGIVING_API_KEY') || 'a950f08e';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting charity cache population...');

    let totalProcessed = 0;
    let totalInserted = 0;
    let errors: string[] = [];

    // Step 1: Search for verified charities
    for (const searchTerm of VERIFIED_CHARITY_SEARCHES) {
      try {
        console.log(`🔍 Searching for: ${searchTerm}`);
        
        const charities = await searchJustGivingCharities(searchTerm, justGivingApiKey);
        
        if (charities.length === 0) {
          console.log(`❌ No results for: ${searchTerm}`);
          continue;
        }

        console.log(`✅ Found ${charities.length} charities for: ${searchTerm}`);

        // Process each charity from search results
        for (const charity of charities.slice(0, 5)) { // Limit to first 5 results per search
          try {
            totalProcessed++;

            // Get detailed charity information
            const detailedCharity = await getCharityDetails(charity.charityId, justGivingApiKey);
            const charityToUse = detailedCharity || charity;

            const slug = generateSlug(charityToUse.name);

            // Insert or update charity in cache
            const { data, error } = await supabase
              .from('justgiving_charity_cache')
              .upsert({
                justgiving_charity_id: charityToUse.charityId.toString(),
                name: charityToUse.name,
                description: charityToUse.description || null,
                logo_url: charityToUse.logoAbsoluteUrl || null,
                slug: slug,
                category: charityToUse.categories?.[0]?.category || null,
                is_active: true,
                is_featured: PRIORITY_CHARITY_IDS.includes(charityToUse.charityId),
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'justgiving_charity_id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`Error upserting charity ${charityToUse.name}:`, error);
              errors.push(`Failed to upsert ${charityToUse.name}: ${error.message}`);
            } else {
              totalInserted++;
              console.log(`✅ Cached: ${charityToUse.name} (${slug})`);
            }

          } catch (charityError) {
            console.error(`Error processing charity:`, charityError);
            errors.push(`Failed to process charity: ${charityError instanceof Error ? charityError.message : 'Unknown error'}`);
          }
        }

        // Add delay between searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (searchError) {
        console.error(`Error searching for "${searchTerm}":`, searchError);
        errors.push(`Failed search for "${searchTerm}": ${searchError instanceof Error ? searchError.message : 'Unknown error'}`);
      }
    }

    // Step 2: Ensure priority charities are cached
    console.log('🎯 Processing priority charities...');
    for (const charityId of PRIORITY_CHARITY_IDS) {
      try {
        const charity = await getCharityDetails(charityId, justGivingApiKey);
        
        if (charity) {
          const slug = generateSlug(charity.name);

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
              is_featured: true,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'justgiving_charity_id',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`Error upserting priority charity ${charity.name}:`, error);
            errors.push(`Failed to upsert priority charity ${charity.name}: ${error.message}`);
          } else {
            console.log(`✅ Priority cached: ${charity.name}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing priority charity ${charityId}:`, error);
        errors.push(`Failed to process priority charity ${charityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const results = {
      success: true,
      message: 'Charity cache population completed',
      totalProcessed,
      totalInserted,
      searchTermsProcessed: VERIFIED_CHARITY_SEARCHES.length,
      priorityCharitiesProcessed: PRIORITY_CHARITY_IDS.length,
      errors: errors.slice(0, 10), // Limit error list
      timestamp: new Date().toISOString()
    };

    console.log('🎉 Charity cache population completed:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
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
      status: 500,
    });
  }
});