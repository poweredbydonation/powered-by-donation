import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Country code mapping for ACNC operating countries
const COUNTRY_CODES: Record<string, string> = {
  'AUS': 'Australia', 'USA': 'United States', 'GBR': 'United Kingdom', 'CAN': 'Canada',
  'NZL': 'New Zealand', 'DEU': 'Germany', 'FRA': 'France', 'ITA': 'Italy', 'ESP': 'Spain',
  'NLD': 'Netherlands', 'BEL': 'Belgium', 'CHE': 'Switzerland', 'AUT': 'Austria',
  'SWE': 'Sweden', 'NOR': 'Norway', 'DNK': 'Denmark', 'FIN': 'Finland', 'IRL': 'Ireland',
  'PRT': 'Portugal', 'GRC': 'Greece', 'POL': 'Poland', 'CZE': 'Czech Republic',
  'HUN': 'Hungary', 'SVK': 'Slovakia', 'SVN': 'Slovenia', 'HRV': 'Croatia',
  'BGR': 'Bulgaria', 'ROU': 'Romania', 'ROM': 'Romania', 'EST': 'Estonia',
  'LVA': 'Latvia', 'LTU': 'Lithuania', 'JPN': 'Japan', 'KOR': 'South Korea',
  'CHN': 'China', 'IND': 'India', 'SGP': 'Singapore', 'MYS': 'Malaysia',
  'THA': 'Thailand', 'IDN': 'Indonesia', 'PHL': 'Philippines', 'VNM': 'Vietnam',
  'HKG': 'Hong Kong', 'TWN': 'Taiwan', 'ZAF': 'South Africa', 'KEN': 'Kenya',
  'NGA': 'Nigeria', 'EGY': 'Egypt', 'MAR': 'Morocco', 'BRA': 'Brazil',
  'ARG': 'Argentina', 'CHL': 'Chile', 'MEX': 'Mexico', 'COL': 'Colombia',
  'PER': 'Peru', 'VEN': 'Venezuela', 'URY': 'Uruguay', 'ECU': 'Ecuador',
  'BOL': 'Bolivia', 'PRY': 'Paraguay', 'ISR': 'Israel', 'ARE': 'United Arab Emirates',
  'SAU': 'Saudi Arabia', 'QAT': 'Qatar', 'KWT': 'Kuwait', 'BHR': 'Bahrain',
  'BRN': 'Bahrain', 'OMN': 'Oman', 'JOR': 'Jordan', 'LBN': 'Lebanon',
  'TUR': 'Turkey', 'RUS': 'Russia', 'UKR': 'Ukraine', 'BLR': 'Belarus',
  'KAZ': 'Kazakhstan', 'UZB': 'Uzbekistan', 'KGZ': 'Kyrgyzstan', 'TJK': 'Tajikistan',
  'TKM': 'Turkmenistan', 'AFG': 'Afghanistan', 'PAK': 'Pakistan', 'BGD': 'Bangladesh',
  'LKA': 'Sri Lanka', 'NPL': 'Nepal', 'BTN': 'Bhutan', 'MDV': 'Maldives',
  'MMR': 'Myanmar', 'LAO': 'Laos', 'KHM': 'Cambodia', 'PNG': 'Papua New Guinea',
  'FJI': 'Fiji', 'VUT': 'Vanuatu', 'SLB': 'Solomon Islands', 'NCL': 'New Caledonia',
  'PYF': 'French Polynesia', 'GUM': 'Guam', 'ASM': 'American Samoa', 'WSM': 'Samoa',
  'TON': 'Tonga', 'KIR': 'Kiribati', 'TUV': 'Tuvalu', 'NRU': 'Nauru',
  'PLW': 'Palau', 'MHL': 'Marshall Islands', 'FSM': 'Federated States of Micronesia',
  'COK': 'Cook Islands', 'NIU': 'Niue', 'TKL': 'Tokelau'
}

function getCountryName(code: string): string | null {
  if (!code || typeof code !== 'string') return null
  const upperCode = code.trim().toUpperCase()
  return COUNTRY_CODES[upperCode] || null
}

function parseOperatingCountries(countriesString: string): string[] {
  if (!countriesString || typeof countriesString !== 'string') return []
  
  return countriesString
    .split(/[,;|]/)
    .map(code => code.trim())
    .filter(code => code.length > 0)
    .map(code => getCountryName(code))
    .filter(name => name !== null)
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .sort()
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Organization {
  platform: string
  category?: string
  address_city?: string
  address_country?: string
  acnc_purposes?: Record<string, boolean>
  acnc_beneficiaries?: Record<string, boolean>
  acnc_operates_in_act?: string
  acnc_operates_in_nsw?: string
  acnc_operates_in_nt?: string
  acnc_operates_in_qld?: string
  acnc_operates_in_sa?: string
  acnc_operates_in_tas?: string
  acnc_operates_in_vic?: string
  acnc_operates_in_wa?: string
  acnc_operating_countries?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting filter lookup tables population...')

    // Get ALL organizations for processing (handle large datasets with proper pagination)
    let allOrganizations = []
    let from = 0
    const batchSize = 1000
    
    while (true) {
      console.log(`Fetching organizations ${from} to ${from + batchSize - 1}...`)
      const { data: batch, error: batchError } = await supabaseClient
        .from('organization_cache')
        .select('platform, category, address_city, address_country, acnc_purposes, acnc_beneficiaries, acnc_operates_in_act, acnc_operates_in_nsw, acnc_operates_in_nt, acnc_operates_in_qld, acnc_operates_in_sa, acnc_operates_in_tas, acnc_operates_in_vic, acnc_operates_in_wa, acnc_operating_countries')
        .eq('is_active', true)
        .eq('show_on_platform', true)
        .range(from, from + batchSize - 1)
      
      if (batchError) {
        console.error('Error fetching batch:', batchError)
        break
      }
      
      if (!batch || batch.length === 0) {
        console.log('No more organizations to fetch')
        break
      }
      
      allOrganizations = allOrganizations.concat(batch)
      console.log(`Fetched ${batch.length} organizations, total so far: ${allOrganizations.length}`)
      
      if (batch.length < batchSize) {
        console.log('Reached end of data')
        break
      }
      
      from += batchSize
    }
    
    const organizations = allOrganizations
    const orgError = null

    if (orgError) {
      console.error('Error fetching organizations:', orgError)
      return new Response(JSON.stringify({ error: orgError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!organizations || organizations.length === 0) {
      return new Response(JSON.stringify({ message: 'No organizations found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing ${organizations.length} organizations...`)

    // Process ACNC data
    await processAcncData(supabaseClient, organizations.filter(org => org.platform === 'acnc'))
    
    // Process JustGiving data
    await processJustGivingData(supabaseClient, organizations.filter(org => org.platform === 'justgiving'))
    
    // Process Every.org data
    await processEveryOrgData(supabaseClient, organizations.filter(org => org.platform === 'everyorg'))

    console.log('Filter lookup tables population completed successfully')

    return new Response(JSON.stringify({ 
      message: 'Filter lookup tables populated successfully',
      processed_organizations: organizations.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in populate_filter_lookup_tables:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processAcncData(supabaseClient: any, acncOrgs: Organization[]) {
  console.log(`Processing ${acncOrgs.length} ACNC organizations...`)

  // Extract and count categories
  const categoryCount = new Map<string, number>()
  const purposeCount = new Map<string, number>()
  const beneficiaryCount = new Map<string, number>()
  const cityCount = new Map<string, number>()
  const stateCount = new Map<string, number>()
  const operatingCountryCount = new Map<string, number>()

  acncOrgs.forEach(org => {
    // Categories
    if (org.category) {
      categoryCount.set(org.category, (categoryCount.get(org.category) || 0) + 1)
    }

    // Cities
    if (org.address_city) {
      cityCount.set(org.address_city, (cityCount.get(org.address_city) || 0) + 1)
    }

    // Purposes
    if (org.acnc_purposes && typeof org.acnc_purposes === 'object') {
      Object.entries(org.acnc_purposes).forEach(([purpose, value]) => {
        if (value === true || value === 'true') {
          purposeCount.set(purpose, (purposeCount.get(purpose) || 0) + 1)
        }
      })
    }

    // Beneficiaries
    if (org.acnc_beneficiaries && typeof org.acnc_beneficiaries === 'object') {
      Object.entries(org.acnc_beneficiaries).forEach(([beneficiary, value]) => {
        if (value === true || value === 'true') {
          beneficiaryCount.set(beneficiary, (beneficiaryCount.get(beneficiary) || 0) + 1)
        }
      })
    }

    // States
    if (org.acnc_operates_in_act === 'Y') stateCount.set('ACT', (stateCount.get('ACT') || 0) + 1)
    if (org.acnc_operates_in_nsw === 'Y') stateCount.set('NSW', (stateCount.get('NSW') || 0) + 1)
    if (org.acnc_operates_in_nt === 'Y') stateCount.set('NT', (stateCount.get('NT') || 0) + 1)
    if (org.acnc_operates_in_qld === 'Y') stateCount.set('QLD', (stateCount.get('QLD') || 0) + 1)
    if (org.acnc_operates_in_sa === 'Y') stateCount.set('SA', (stateCount.get('SA') || 0) + 1)
    if (org.acnc_operates_in_tas === 'Y') stateCount.set('TAS', (stateCount.get('TAS') || 0) + 1)
    if (org.acnc_operates_in_vic === 'Y') stateCount.set('VIC', (stateCount.get('VIC') || 0) + 1)
    if (org.acnc_operates_in_wa === 'Y') stateCount.set('WA', (stateCount.get('WA') || 0) + 1)

    // Operating countries
    if (org.acnc_operating_countries && typeof org.acnc_operating_countries === 'string' && org.acnc_operating_countries.trim()) {
      const countryNames = parseOperatingCountries(org.acnc_operating_countries)
      countryNames.forEach(countryName => {
        operatingCountryCount.set(countryName, (operatingCountryCount.get(countryName) || 0) + 1)
      })
    }
  })

  // Update lookup tables
  await updateLookupTable(supabaseClient, 'acnc_categories_lookup', 'category', categoryCount)
  await updateLookupTable(supabaseClient, 'acnc_purposes_lookup', 'purpose', purposeCount)
  await updateLookupTable(supabaseClient, 'acnc_beneficiaries_lookup', 'beneficiary', beneficiaryCount)
  await updateLookupTable(supabaseClient, 'acnc_cities_lookup', 'city', cityCount)
  await updateLookupTable(supabaseClient, 'acnc_states_lookup', 'state', stateCount)
  await updateLookupTable(supabaseClient, 'acnc_operating_countries_lookup', 'country', operatingCountryCount)
}

async function processJustGivingData(supabaseClient: any, justgivingOrgs: Organization[]) {
  console.log(`Processing ${justgivingOrgs.length} JustGiving organizations...`)

  const countryCount = new Map<string, number>()
  const cityCount = new Map<string, number>()

  justgivingOrgs.forEach(org => {
    if (org.address_country) {
      countryCount.set(org.address_country, (countryCount.get(org.address_country) || 0) + 1)
    }
    if (org.address_city) {
      cityCount.set(org.address_city, (cityCount.get(org.address_city) || 0) + 1)
    }
  })

  await updateLookupTable(supabaseClient, 'justgiving_countries_lookup', 'country', countryCount)
  await updateLookupTable(supabaseClient, 'justgiving_cities_lookup', 'city', cityCount)
}

async function processEveryOrgData(supabaseClient: any, everyorgOrgs: Organization[]) {
  console.log(`Processing ${everyorgOrgs.length} Every.org organizations...`)

  const categoryCount = new Map<string, number>()

  everyorgOrgs.forEach(org => {
    if (org.category) {
      categoryCount.set(org.category, (categoryCount.get(org.category) || 0) + 1)
    }
  })

  await updateLookupTable(supabaseClient, 'everyorg_categories_lookup', 'category', categoryCount)
}

async function updateLookupTable(
  supabaseClient: any, 
  tableName: string, 
  fieldName: string, 
  dataCount: Map<string, number>
) {
  if (dataCount.size === 0) {
    console.log(`No data to update for ${tableName}`)
    return
  }

  // Clear existing data
  const { error: deleteError } = await supabaseClient
    .from(tableName)
    .delete()
    .neq('id', 0)

  if (deleteError) {
    console.error(`Error clearing ${tableName}:`, deleteError)
    return
  }

  // Insert new data
  const insertData = Array.from(dataCount.entries()).map(([value, count]) => ({
    [fieldName]: value,
    organization_count: count
  }))

  const { error: insertError } = await supabaseClient
    .from(tableName)
    .insert(insertData)

  if (insertError) {
    console.error(`Error inserting into ${tableName}:`, insertError)
  } else {
    console.log(`Updated ${tableName} with ${insertData.length} entries`)
  }
}