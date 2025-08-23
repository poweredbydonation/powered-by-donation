import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// CORS headers for Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};
// Email notification service for fundraisers
async function sendFundraiserNotification(request, donation) {
  if (!request.users?.email || !request.users?.name || !request.services?.title) {
    console.log(`⚠️ Missing notification data for request ${request.id} - skipping email`);
    return;
  }
  try {
    console.log(`📧 Sending fundraiser notification to ${request.users.email}`);
    // For now, we'll just log the notification content
    // In production, this would use a service like Resend, SendGrid, or Supabase Edge Functions with SMTP
    const emailData = {
      to: request.users.email,
      subject: `🎉 You received a £${request.donation_amount} donation!`,
      html: `
        <h2>Great news, ${request.users.name}!</h2>
        <p>Someone just donated <strong>£${request.donation_amount}</strong> to <strong>${request.organization_name}</strong> for your service: <strong>"${request.services.title}"</strong></p>
        
        <h3>📋 Donation Details:</h3>
        <ul>
          <li><strong>Amount:</strong> £${request.donation_amount}</li>
          <li><strong>Charity:</strong> ${request.organization_name}</li>
          <li><strong>Service:</strong> ${request.services.title}</li>
          <li><strong>Platform Reference:</strong> ${request.reference_id}</li>
          <li><strong>External Donation ID:</strong> ${donation.donationId}</li>
          <li><strong>Date:</strong> ${new Date(donation.donationDate).toLocaleDateString('en-GB')}</li>
        </ul>

        <h3>🤝 What happens next?</h3>
        <p>The donor will receive your contact information so you can coordinate the service delivery. We'll follow up in a few days to collect feedback from both parties to maintain our platform's quality.</p>
        
        <p>Thank you for being part of Powered by Donation! 🙌</p>
        
        <hr>
        <small>This donation was processed through JustGiving. Your donor chose to support ${request.organization_name} as part of this service exchange.</small>
      `,
      text: `
Great news, ${request.users.name}!

Someone just donated £${request.donation_amount} to ${request.organization_name} for your service: "${request.services.title}"

Donation Details:
- Amount: £${request.donation_amount}
- Charity: ${request.organization_name}
- Service: ${request.services.title}
- Platform Reference: ${request.reference_id}
- External Donation ID: ${donation.donationId}
- Date: ${new Date(donation.donationDate).toLocaleDateString('en-GB')}

What happens next?
The donor will receive your contact information so you can coordinate the service delivery. We'll follow up in a few days to collect feedback from both parties to maintain our platform's quality.

Thank you for being part of Powered by Donation!

This donation was processed through JustGiving. Your donor chose to support ${request.organization_name} as part of this service exchange.
      `
    };
    console.log('📧 Email notification prepared:', {
      to: emailData.to,
      subject: emailData.subject,
      reference_id: request.reference_id,
      donation_amount: request.donation_amount,
      service_title: request.services.title
    });
    // TODO: Integrate with actual email service
    // await sendEmail(emailData)
    console.log(`✅ Notification logged for ${request.users.email} (${request.reference_id})`);
  } catch (error) {
    console.error(`❌ Failed to send notification for request ${request.id}:`, error);
  // Don't throw - notification failures shouldn't stop the polling process
  }
}
class JustGivingAPI {
  apiKey;
  baseUrl;
  constructor(){
    // Use environment variables with fallback to staging
    this.apiKey = Deno.env.get('JUSTGIVING_API_KEY');
    this.baseUrl = Deno.env.get('JUSTGIVING_API_URL');
  }
  async getDonationByReference(reference) {
    // JustGiving staging API format: /{appId}/v1/donation/ref/{reference}
    const endpoint = `/${this.apiKey}/v1/donation/ref/${encodeURIComponent(reference)}`;
    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log(`Checking donation status for reference: ${reference}`);
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log(`JustGiving API response status: ${response.status}`);
      if (response.status === 404) {
        console.log(`Donation with reference ${reference} not found yet (likely still pending)`);
        return {
          donation: null,
          found: false
        };
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JustGiving API error response: ${errorText}`);
        throw new Error(`JustGiving API error! status: ${response.status}, message: ${errorText}`);
      }
      const responseData = await response.json();
      console.log(`JustGiving API raw response:`, responseData);
      // JustGiving staging API returns: { donations: [...], pagination: {...} }
      if (!responseData.donations || responseData.donations.length === 0) {
        console.log(`No donations found for reference ${reference}`);
        return {
          donation: null,
          found: false
        };
      }
      const donationData = responseData.donations[0] // Get first (and likely only) donation
      ;
      const donation = {
        donationId: donationData.id.toString(),
        donationRef: donationData.donationRef,
        donorName: donationData.donorDisplayName || 'Anonymous',
        donationAmount: parseFloat(donationData.amount),
        currencyCode: donationData.currencyCode,
        donationDate: donationData.donationDate,
        charityId: donationData.charityId,
        donationStatus: donationData.status
      };
      console.log(`Found donation:`, donation);
      return {
        donation,
        found: true
      };
    } catch (error) {
      console.error(`Error checking donation status for reference ${reference}:`, error);
      throw error;
    }
  }
}
async function checkPendingDonations() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const justGivingAPI = new JustGivingAPI();
  console.log('🔍 Starting donation status check...');
  // Query pending donations that haven't timed out yet - include fundraiser and service info for notifications
  const { data: pendingRequests, error: queryError } = await supabase.from('service_requests').select(`
      id, platform, reference_id, status, timeout_at, external_donation_id, created_at, organization_name, donation_amount,
      fundraiser_id,
      service_id,
      users!service_requests_fundraiser_id_fkey(id, name, email),
      services!inner(title)
    `).eq('status', 'pending').not('reference_id', 'is', null).or('timeout_at.is.null,timeout_at.gt.now()');
  if (queryError) {
    console.error('Error querying pending donations:', queryError);
    throw queryError;
  }
  console.log(`Found ${pendingRequests?.length || 0} pending donation requests to check`);
  if (!pendingRequests || pendingRequests.length === 0) {
    console.log('No pending donations to check');
    return {
      message: 'No pending donations found',
      checked: 0,
      updated: 0
    };
  }
  let updatedCount = 0;
  let timedOutCount = 0;
  for (const request of pendingRequests){
    try {
      console.log(`\n--- Checking donation request ${request.id} ---`);
      console.log(`Reference: ${request.reference_id}`);
      console.log(`Platform: ${request.platform}`);
      console.log(`Created: ${request.created_at}`);
      // Check if donation has timed out (24 hours from creation)
      if (request.created_at) {
        const createdTime = new Date(request.created_at);
        const timeoutTime = new Date(createdTime.getTime() + 24 * 60 * 60 * 1000) // 24 hours
        ;
        const now = new Date();
        if (now > timeoutTime) {
          console.log(`⏰ Donation request ${request.id} has timed out (>24h old)`);
          const { error: timeoutError } = await supabase.from('service_requests').update({
            status: 'fundraiser_review',
            timeout_at: new Date().toISOString()
          }).eq('id', request.id);
          if (timeoutError) {
            console.error(`Error updating timed out donation ${request.id}:`, timeoutError);
          } else {
            console.log(`✅ Marked donation ${request.id} as timed out`);
            timedOutCount++;
          }
          continue;
        }
      }
      // Only check JustGiving donations for now (Every.org will be Phase 2)
      if (request.platform !== 'justgiving' || !request.reference_id) {
        console.log(`Skipping non-JustGiving donation: ${request.platform}`);
        continue;
      }
      // Check donation status with JustGiving
      const donationResult = await justGivingAPI.getDonationByReference(request.reference_id);
      if (!donationResult.found) {
        console.log(`Donation ${request.reference_id} not found yet, keeping as pending`);
        continue;
      }
      const donation = donationResult.donation;
      console.log(`Found donation with status: ${donation.donationStatus}`);
      // Update database based on donation status
      let newStatus;
      let updateData = {
        external_donation_id: donation.donationId
      };
      switch(donation.donationStatus){
        case 'Accepted':
          newStatus = 'success';
          console.log(`✅ Donation ${request.reference_id} completed successfully`);
          break;
        case 'Pending':
          // Keep as pending, don't update
          console.log(`⏳ Donation ${request.reference_id} still pending`);
          continue;
        case 'Rejected':
          newStatus = 'fundraiser_review';
          console.log(`❌ Donation ${request.reference_id} was rejected`);
          break;
        default:
          console.log(`Unknown donation status: ${donation.donationStatus}`);
          continue;
      }
      updateData.status = newStatus;
      const { error: updateError } = await supabase.from('service_requests').update(updateData).eq('id', request.id);
      if (updateError) {
        console.error(`Error updating donation ${request.id}:`, updateError);
      } else {
        console.log(`✅ Updated donation ${request.id} to status: ${newStatus}`);
        updatedCount++;
        // 📧 Send notification to fundraiser ONLY for successful donations
        if (newStatus === 'success') {
          console.log(`🔔 Sending fundraiser notification for successful donation ${request.reference_id}`);
          await sendFundraiserNotification(request, donation);
        }
      }
    } catch (error) {
      console.error(`Error processing donation request ${request.id}:`, error);
    // Continue with other donations even if one fails
    }
  }
  const summary = {
    message: 'Donation status check completed',
    checked: pendingRequests.length,
    updated: updatedCount,
    timedOut: timedOutCount,
    timestamp: new Date().toISOString()
  };
  console.log('\n🏁 Donation check summary:', summary);
  return summary;
}
// Main Supabase Edge Function handler
Deno.serve(async (req)=>{
  const { method } = req;
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log(`🚀 Check donations function invoked via ${method}`);
    // Run the donation status checking logic
    const result = await checkPendingDonations();
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in check-donations function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
