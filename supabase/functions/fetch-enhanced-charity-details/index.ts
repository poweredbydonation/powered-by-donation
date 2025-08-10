import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface JustGivingCharityDetails {
  name: string
  address?: {
    line1: string
    line2?: string
    townOrCity: string
    countyOrState?: string
    country: string
    postcodeOrZipcode: string
  }
  displayName?: string
  description?: string
  logoUrl?: string
  logoAbsoluteUrl?: string
  profilePageUrl?: string
  registrationNumber?: string
  websiteUrl?: string
  id: number
  isApproved: boolean
  showInSearch: boolean
  pageShortName: string
  emailAddress?: string
  keywords?: string
  dateAddedToJustGiving?: string
  thankyouMessage?: string
  mobileAppeals?: Array<{
    smsCode: string
    name: string
  }>
  categories?: string[]
  donationDisplayAmounts?: Array<{
    amount: number
    description: string
    name: string
    donationPromptType?: string
  }>
  impactStatementWhat?: string
  impactStatementWhy?: string
  countryCode: string
  currencyCode: string
  themeColour?: {
    alpha: number
    red: number
    green: number
    blue: number
  }
  smsShortName?: string
}

// Try multiple API approaches to find working endpoint
async function fetchCharityDetails(charityId: string, apiKey: string): Promise<JustGivingCharityDetails | null> {
  const urlVariations = [
    // Different URL formats to try
    `https://api.justgiving.com/${apiKey}/v1/charity/${charityId}`,
    `https://api.justgiving.com/v1/charity/${charityId}?appId=${apiKey}`,
    `https://api.justgiving.com/${apiKey}/v1/charity/${charityId}?format=json`,
  ]

  const headerVariations = [
    // Different header approaches
    { 'Content-Type': 'application/json' },
    { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    { 'Content-Type': 'application/json', 'User-Agent': 'PoweredByDonation/1.0' },
  ]

  for (const url of urlVariations) {
    for (const headers of headerVariations) {
      try {
        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(8000) // 8 second timeout
        })

        if (response.ok) {
          const data = await response.json()
          return data
        } else if (response.status !== 403 && response.status !== 401) {
          // Log non-auth errors but continue trying
          console.log(`⚠️ Status ${response.status} for: ${url}`)
        }
        
      } catch (error) {
        // Continue trying other combinations
        continue
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const justGivingApiKey = Deno.env.get('JUSTGIVING_API_KEY') || 'd01c672d'
    
    console.log('🚀 Starting enhanced charity details fetch...')

    // Get charities that need enhanced data (process 20 per run)
    const { data: charities, error: fetchError } = await supabase
      .from('justgiving_charity_cache')
      .select('justgiving_charity_id, name, api_fetch_attempts')
      .is('enhanced_data_fetched_at', null)
      .lt('api_fetch_attempts', 3)
      .eq('is_active', true)
      .limit(20)

    if (fetchError) {
      throw new Error(`Failed to fetch charities: ${fetchError.message}`)
    }

    if (!charities || charities.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No charities need enhanced data fetching',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${charities.length} charities needing enhanced data`)

    let successCount = 0
    let errorCount = 0
    const startTime = Date.now()
    const maxExecutionTime = 8 * 60 * 1000 // 8 minutes max

    // Process each charity
    for (const charity of charities) {
      const timeRemaining = maxExecutionTime - (Date.now() - startTime)
      
      // Stop if less than 1 minute remaining
      if (timeRemaining < 60000) {
        console.warn(`⏰ Stopping early - only ${Math.round(timeRemaining / 1000)}s remaining`)
        break
      }

      try {
        console.log(`🔍 Fetching enhanced data for charity ID: ${charity.justgiving_charity_id}`)

        const charityDetails = await fetchCharityDetails(charity.justgiving_charity_id, justGivingApiKey)
        
        if (!charityDetails) {
          throw new Error('No charity details returned from API')
        }

        // Parse JustGiving date format /Date(1754807753016+0000)/
        let parsedDate: Date | null = null
        if (charityDetails.dateAddedToJustGiving) {
          const match = charityDetails.dateAddedToJustGiving.match(/\/Date\((\d+)/)
          if (match) {
            parsedDate = new Date(parseInt(match[1]))
          }
        }

        // Update charity cache with enhanced data
        const { error: updateError } = await supabase
          .from('justgiving_charity_cache')
          .update({
            // Address information
            address_line1: charityDetails.address?.line1,
            address_line2: charityDetails.address?.line2,
            address_city: charityDetails.address?.townOrCity,
            address_county: charityDetails.address?.countyOrState,
            address_country: charityDetails.address?.country,
            address_postcode: charityDetails.address?.postcodeOrZipcode,
            
            // Core details
            display_name: charityDetails.displayName,
            description: charityDetails.description || null,
            logo_absolute_url: charityDetails.logoAbsoluteUrl,
            profile_page_url: charityDetails.profilePageUrl,
            registration_number: charityDetails.registrationNumber,
            website_url: charityDetails.websiteUrl,
            email_address: charityDetails.emailAddress,
            keywords: charityDetails.keywords,
            page_short_name: charityDetails.pageShortName,
            sms_short_name: charityDetails.smsShortName,
            
            // Status
            is_approved: charityDetails.isApproved,
            show_in_search: charityDetails.showInSearch,
            date_added_to_justgiving: parsedDate?.toISOString(),
            
            // Messaging and impact
            thankyou_message: charityDetails.thankyouMessage,
            impact_statement_what: charityDetails.impactStatementWhat,
            impact_statement_why: charityDetails.impactStatementWhy,
            
            // Localization
            country_code: charityDetails.countryCode,
            currency_code: charityDetails.currencyCode,
            
            // JSON data
            mobile_appeals: charityDetails.mobileAppeals || null,
            donation_display_amounts: charityDetails.donationDisplayAmounts || null,
            theme_colour: charityDetails.themeColour || null,
            categories_list: charityDetails.categories || null,
            
            // Tracking
            enhanced_data_fetched_at: new Date().toISOString(),
            api_fetch_attempts: 0,
            last_updated: new Date().toISOString()
          })
          .eq('justgiving_charity_id', charity.justgiving_charity_id)

        if (updateError) {
          throw new Error(`Failed to update charity cache: ${updateError.message}`)
        }

        successCount++
        console.log(`✅ Enhanced data updated for: ${charity.name}`)

        // Delay between requests to be respectful to API
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        errorCount++
        console.error(`❌ Failed to process charity ${charity.justgiving_charity_id}:`, error)

        // Increment attempt counter for failed requests
        const currentAttempts = charity.api_fetch_attempts || 0
        await supabase
          .from('justgiving_charity_cache')
          .update({
            api_fetch_attempts: currentAttempts + 1
          })
          .eq('justgiving_charity_id', charity.justgiving_charity_id)
      }
    }

    const result = {
      success: true,
      message: `Enhanced data fetch completed`,
      processed: successCount + errorCount,
      successful: successCount,
      failed: errorCount,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Enhanced charity details fetch completed:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Enhanced charity details fetch failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})