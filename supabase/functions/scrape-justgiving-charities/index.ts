// Supabase Edge Function: Scrape JustGiving A-Z Charity Pages
// Scrapes charity slugs and IDs from JustGiving's alphabetical charity directory
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// All alphabetical pages to scrape
const ALPHABET_LETTERS = [
  '0-9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function scrapeCharityPage(letter: string): Promise<Array<{charityId: string, name: string, slug: string}>> {
  const url = `https://www.justgiving.com/find-charities/${letter}`;
  const charities: Array<{charityId: string, name: string, slug: string}> = [];
  
  console.log(`🔍 Scraping: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return charities;
    }
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      console.error(`Failed to parse HTML for ${letter}`);
      return charities;
    }
    
    // Find all links that go to JustGiving charity pages
    // Looking for patterns like: href="https://www.justgiving.com/charity-slug"
    const links = doc.querySelectorAll('a[href*="justgiving.com/"]');
    
    for (const link of links) {
      const href = link.getAttribute('href');
      const name = link.textContent?.trim();
      
      if (href && name) {
        // Extract slug from full JustGiving URLs
        // e.g., "https://www.justgiving.com/gablesfarm" -> "gablesfarm"
        let slug = '';
        
        if (href.includes('justgiving.com/') && !href.includes('/charity/')) {
          // Direct charity URL format: https://www.justgiving.com/charity-slug
          const match = href.match(/justgiving\.com\/([^\/\?]+)/);
          if (match) {
            slug = match[1];
          }
        } else if (href.includes('/charity/')) {
          // Alternative format: /charity/charity-slug or full URL with /charity/
          const match = href.match(/\/charity\/([^\/\?]+)/);
          if (match) {
            slug = match[1];
          }
        }
        
        // Skip common non-charity pages
        if (slug && !['login', 'register', 'help', 'about', 'terms', 'privacy', 'contact'].includes(slug.toLowerCase())) {
          charities.push({
            charityId: '', // Will be populated separately
            name,
            slug
          });
        }
      }
    }
    
    console.log(`📄 Found ${charities.length} charities on page ${letter}`);
    
  } catch (error) {
    console.error(`Error scraping ${letter}:`, error);
  }
  
  return charities;
}

async function getCharityIdFromPage(slug: string): Promise<string | null> {
  const url = `https://www.justgiving.com/charity/${slug}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch charity page ${slug}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      console.error(`Failed to parse HTML for charity ${slug}`);
      return null;
    }
    
    // Look for "Start fundraising" button with charityId parameter
    // Example: https://www.justgiving.com/create-page?charityId=2365325
    const startFundraisingLinks = doc.querySelectorAll('a[href*="create-page?charityId="]');
    
    for (const link of startFundraisingLinks) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/charityId=(\d+)/);
        if (match) {
          return match[1];
        }
      }
    }
    
    // Alternative: look for donation links with charity ID
    const donationLinks = doc.querySelectorAll('a[href*="/donate/charityId/"]');
    for (const link of donationLinks) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/charityId\/(\d+)/);
        if (match) {
          return match[1];
        }
      }
    }
    
    console.warn(`Could not find charity ID for ${slug}`);
    return null;
    
  } catch (error) {
    console.error(`Error getting charity ID for ${slug}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request parameters
    const url = new URL(req.url);
    const specificLetter = url.searchParams.get('letter');
    const skipIdFetching = url.searchParams.get('skipIds') === 'true';
    
    console.log('🚀 Starting JustGiving charity scraping...');
    
    let totalFound = 0;
    let totalInserted = 0;
    let totalWithIds = 0;
    let errors: string[] = [];
    const startTime = Date.now();
    
    // Determine which letters to process
    const lettersToProcess = specificLetter ? [specificLetter] : ALPHABET_LETTERS;
    
    for (const letter of lettersToProcess) {
      try {
        console.log(`🔍 Processing letter: ${letter}`);
        
        // Scrape charity listings from the A-Z page
        const charities = await scrapeCharityPage(letter);
        
        if (charities.length === 0) {
          console.log(`❌ No charities found for letter: ${letter}`);
          continue;
        }
        
        totalFound += charities.length;
        console.log(`✅ Found ${charities.length} charities for letter: ${letter}`);
        
        // Process charities in smaller batches to avoid timeout
        const batchSize = 5; // Process 5 charities per letter max
        const charitiesSubset = charities.slice(0, batchSize);
        
        console.log(`📦 Processing ${charitiesSubset.length} charities from ${charities.length} found`);
        
        for (const charity of charitiesSubset) {
          try {
            // Get charity ID - only proceed if we can get it
            const charityId = await getCharityIdFromPage(charity.slug);
            
            if (!charityId) {
              console.warn(`⚠️ Skipping ${charity.name} - no charity ID found`);
              continue;
            }
            
            totalWithIds++;
            console.log(`🆔 Found ID ${charityId} for ${charity.name}`);
            
            // Only insert if we have a valid charity ID
            const { error } = await supabase
              .from('justgiving_charity_cache')
              .upsert({
                justgiving_charity_id: charityId,
                name: charity.name,
                slug: charity.slug,
                is_active: true,
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
              console.log(`✅ Cached: ${charity.name} (${charity.slug})`);
            }
            
            // Small delay between charity page visits
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (charityError) {
            console.error(`Error processing charity ${charity.name}:`, charityError);
            errors.push(`Failed to process ${charity.name}: ${charityError instanceof Error ? charityError.message : 'Unknown error'}`);
          }
        }
        
        // Delay between letters to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (letterError) {
        console.error(`Error processing letter ${letter}:`, letterError);
        errors.push(`Failed to process letter ${letter}: ${letterError instanceof Error ? letterError.message : 'Unknown error'}`);
      }
    }
    
    const results = {
      success: true,
      message: 'JustGiving charity scraping completed',
      totalFound,
      totalInserted,
      totalWithIds,
      lettersProcessed: lettersToProcess.length,
      errors: errors.slice(0, 10), // Limit error list
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    console.log('🎉 Charity scraping completed:', results);
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Charity scraping failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Charity scraping failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});