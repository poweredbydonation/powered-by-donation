import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Types for our database (subset of what we need)
interface ServiceRequest {
  id: string
  platform?: 'justgiving' | 'every_org'
  reference_id?: string
  status?: 'pending' | 'success' | 'fundraiser_review' | 'acknowledged_feedback' | 'disputed_feedback' | 'unresponsive_to_feedback'
  timeout_at?: string
  external_donation_id?: string
  created_at?: string
  organization_name?: string
  donation_amount: number
}

interface JustGivingDonation {
  donationId: string
  donationRef: string
  donorName: string
  donationAmount: number
  currencyCode: string
  donationDate: string
  charityId: number
  donationStatus: 'Accepted' | 'Pending' | 'Rejected'
}

interface DonationByReferenceResponse {
  donation: JustGivingDonation | null
  found: boolean
}

class JustGivingAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    // Use environment variables with fallback to staging
    this.apiKey = Deno.env.get('JUSTGIVING_API_KEY') || 'd01c672d'
    this.baseUrl = Deno.env.get('JUSTGIVING_API_URL') || 'https://api.staging.justgiving.com'
  }

  async getDonationByReference(reference: string): Promise<DonationByReferenceResponse> {
    // JustGiving staging API format: /{appId}/v1/donation/ref/{reference}
    const endpoint = `/${this.apiKey}/v1/donation/ref/${encodeURIComponent(reference)}`
    const fullUrl = `${this.baseUrl}${endpoint}`
    
    console.log(`Checking donation status for reference: ${reference}`)
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`JustGiving API response status: ${response.status}`)
      
      if (response.status === 404) {
        console.log(`Donation with reference ${reference} not found yet (likely still pending)`)
        return {
          donation: null,
          found: false
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`JustGiving API error response: ${errorText}`)
        throw new Error(`JustGiving API error! status: ${response.status}, message: ${errorText}`)
      }
      
      const responseData = await response.json()
      console.log(`JustGiving API raw response:`, responseData)
      
      // JustGiving staging API returns: { donations: [...], pagination: {...} }
      if (!responseData.donations || responseData.donations.length === 0) {
        console.log(`No donations found for reference ${reference}`)
        return {
          donation: null,
          found: false
        }
      }
      
      const donationData = responseData.donations[0] // Get first (and likely only) donation
      const donation: JustGivingDonation = {
        donationId: donationData.id.toString(),
        donationRef: donationData.donationRef,
        donorName: donationData.donorDisplayName || 'Anonymous',
        donationAmount: parseFloat(donationData.amount),
        currencyCode: donationData.currencyCode,
        donationDate: donationData.donationDate,
        charityId: donationData.charityId,
        donationStatus: donationData.status as 'Accepted' | 'Pending' | 'Rejected'
      }
      
      console.log(`Found donation:`, donation)
      
      return {
        donation,
        found: true
      }
    } catch (error) {
      console.error(`Error checking donation status for reference ${reference}:`, error)
      throw error
    }
  }
}

async function checkPendingDonations() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const justGivingAPI = new JustGivingAPI()
  
  console.log('🔍 Starting donation status check...')
  
  // Query pending donations that haven't timed out yet
  const { data: pendingRequests, error: queryError } = await supabase
    .from('service_requests')
    .select('id, platform, reference_id, status, timeout_at, external_donation_id, created_at, organization_name, donation_amount')
    .eq('status', 'pending')
    .not('reference_id', 'is', null)
    .or('timeout_at.is.null,timeout_at.gt.now()')
  
  if (queryError) {
    console.error('Error querying pending donations:', queryError)
    throw queryError
  }
  
  console.log(`Found ${pendingRequests?.length || 0} pending donation requests to check`)
  
  if (!pendingRequests || pendingRequests.length === 0) {
    console.log('No pending donations to check')
    return { message: 'No pending donations found', checked: 0, updated: 0 }
  }
  
  let updatedCount = 0
  let timedOutCount = 0
  
  for (const request of pendingRequests as ServiceRequest[]) {
    try {
      console.log(`\n--- Checking donation request ${request.id} ---`)
      console.log(`Reference: ${request.reference_id}`)
      console.log(`Platform: ${request.platform}`)
      console.log(`Created: ${request.created_at}`)
      
      // Check if donation has timed out (24 hours from creation)
      if (request.created_at) {
        const createdTime = new Date(request.created_at)
        const timeoutTime = new Date(createdTime.getTime() + (24 * 60 * 60 * 1000)) // 24 hours
        const now = new Date()
        
        if (now > timeoutTime) {
          console.log(`⏰ Donation request ${request.id} has timed out (>24h old)`)
          
          const { error: timeoutError } = await supabase
            .from('service_requests')
            .update({
              status: 'fundraiser_review',
              timeout_at: new Date().toISOString()
            })
            .eq('id', request.id)
          
          if (timeoutError) {
            console.error(`Error updating timed out donation ${request.id}:`, timeoutError)
          } else {
            console.log(`✅ Marked donation ${request.id} as timed out`)
            timedOutCount++
          }
          continue
        }
      }
      
      // Only check JustGiving donations for now (Every.org will be Phase 2)
      if (request.platform !== 'justgiving' || !request.reference_id) {
        console.log(`Skipping non-JustGiving donation: ${request.platform}`)
        continue
      }
      
      // Check donation status with JustGiving
      const donationResult = await justGivingAPI.getDonationByReference(request.reference_id)
      
      if (!donationResult.found) {
        console.log(`Donation ${request.reference_id} not found yet, keeping as pending`)
        continue
      }
      
      const donation = donationResult.donation!
      console.log(`Found donation with status: ${donation.donationStatus}`)
      
      // Update database based on donation status
      let newStatus: string
      let updateData: any = {
        external_donation_id: donation.donationId
      }
      
      switch (donation.donationStatus) {
        case 'Accepted':
          newStatus = 'success'
          console.log(`✅ Donation ${request.reference_id} completed successfully`)
          break
        case 'Pending':
          // Keep as pending, don't update
          console.log(`⏳ Donation ${request.reference_id} still pending`)
          continue
        case 'Rejected':
          newStatus = 'fundraiser_review'
          console.log(`❌ Donation ${request.reference_id} was rejected`)
          break
        default:
          console.log(`Unknown donation status: ${donation.donationStatus}`)
          continue
      }
      
      updateData.status = newStatus
      
      const { error: updateError } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', request.id)
      
      if (updateError) {
        console.error(`Error updating donation ${request.id}:`, updateError)
      } else {
        console.log(`✅ Updated donation ${request.id} to status: ${newStatus}`)
        updatedCount++
      }
      
    } catch (error) {
      console.error(`Error processing donation request ${request.id}:`, error)
      // Continue with other donations even if one fails
    }
  }
  
  const summary = {
    message: 'Donation status check completed',
    checked: pendingRequests.length,
    updated: updatedCount,
    timedOut: timedOutCount,
    timestamp: new Date().toISOString()
  }
  
  console.log('\n🏁 Donation check summary:', summary)
  return summary
}

// Main Supabase Edge Function handler
Deno.serve(async (req: Request) => {
  const { method } = req
  
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    console.log(`🚀 Check donations function invoked via ${method}`)
    
    // Run the donation status checking logic
    const result = await checkPendingDonations()
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in check-donations function:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})