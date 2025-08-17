// ACNC Cache Population Edge Function
// Populates organization_cache with ACNC charity data from imported ACNC_Registered_Charities table
// Runs as scheduled cron job with batch processing and comprehensive logging

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface ACNCCharity {
  ABN: string;
  Charity_Legal_Name: string;
  Other_Organisation_Names?: string;
  Address_Type?: string;
  Address_Line_1?: string;
  Address_Line_2?: string;
  Address_Line_3?: string;
  Town_City?: string;
  State?: string;
  Postcode?: string;
  Country?: string;
  Charity_Website?: string;
  Registration_Date?: string;
  Date_Organisation_Established?: string;
  Charity_Size?: string;
  Number_of_Responsible_Persons?: string;
  Financial_Year_End?: string;
  Operates_in_ACT?: string;
  Operates_in_NSW?: string;
  Operates_in_NT?: string;
  Operates_in_QLD?: string;
  Operates_in_SA?: string;
  Operates_in_TAS?: string;
  Operates_in_VIC?: string;
  Operates_in_WA?: string;
  Operating_Countries?: string;
  PBI?: string;
  HPC?: string;
  Preventing_or_relieving_suffering_of_animals?: string;
  Advancing_Culture?: string;
  Advancing_Education?: string;
  Advancing_Health?: string;
  Advancing_natual_environment?: string;
  Promoting_or_protecting_human_rights?: string;
  Advancing_Religion?: string;
  Advancing_social_or_public_welfare?: string;
  Aboriginal_or_TSI?: string;
  Adults?: string;
  Aged_Persons?: string;
  Children?: string;
  Communities_Overseas?: string;
  Early_Childhood?: string;
  Ethnic_Groups?: string;
  Families?: string;
  Females?: string;
  Financially_Disadvantaged?: string;
  'LGBTIQA+'?: string;
  General_Community_in_Australia?: string;
  Males?: string;
  Migrants_Refugees_or_Asylum_Seekers?: string;
  Other_Beneficiaries?: string;
  Other_Charities?: string;
  People_at_risk_of_homelessness?: string;
  People_with_Chronic_Illness?: string;
  People_with_Disabilities?: string;
  Pre_Post_Release_Offenders?: string;
  Rural_Regional_Remote_Communities?: string;
  Unemployed_Person?: string;
  Veterans_or_their_families?: string;
  Victims_of_crime?: string;
  Victims_of_Disasters?: string;
  Youth?: string;
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function createSlug(name: string, abn: string): string {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
  
  const cleanAbn = abn.replace(/\s/g, '');
  return `acnc-${cleanAbn}`.substring(0, 50);
}

function extractPurposes(charity: ACNCCharity): Record<string, boolean> {
  const purposeFields = [
    'Preventing_or_relieving_suffering_of_animals',
    'Advancing_Culture', 
    'Advancing_Education',
    'Advancing_Health',
    'Advancing_natual_environment',
    'Promoting_or_protecting_human_rights',
    'Advancing_Religion',
    'Advancing_social_or_public_welfare'
  ];
  
  const purposes: Record<string, boolean> = {};
  purposeFields.forEach(field => {
    const value = charity[field as keyof ACNCCharity];
    purposes[field] = value === 'Y' || value === 'Yes' || value === 'TRUE';
  });
  
  return purposes;
}

function extractBeneficiaries(charity: ACNCCharity): Record<string, boolean> {
  const beneficiaryFields = [
    'Aboriginal_or_TSI', 'Adults', 'Aged_Persons', 'Children',
    'Communities_Overseas', 'Early_Childhood', 'Ethnic_Groups', 'Families',
    'Females', 'Financially_Disadvantaged', 'LGBTIQA+', 'General_Community_in_Australia',
    'Males', 'Migrants_Refugees_or_Asylum_Seekers', 'Other_Beneficiaries',
    'Other_Charities', 'People_at_risk_of_homelessness', 'People_with_Chronic_Illness',
    'People_with_Disabilities', 'Pre_Post_Release_Offenders', 'Rural_Regional_Remote_Communities',
    'Unemployed_Person', 'Veterans_or_their_families', 'Victims_of_crime',
    'Victims_of_Disasters', 'Youth'
  ];
  
  const beneficiaries: Record<string, boolean> = {};
  beneficiaryFields.forEach(field => {
    const value = charity[field as keyof ACNCCharity];
    beneficiaries[field] = value === 'Y' || value === 'Yes' || value === 'TRUE';
  });
  
  return beneficiaries;
}

function determineCategory(purposes: Record<string, boolean>): string {
  if (purposes.Advancing_Education) return 'Education';
  if (purposes.Advancing_Health) return 'Health';
  if (purposes.Advancing_Religion) return 'Religion';
  if (purposes.Advancing_Culture) return 'Arts & Culture';
  if (purposes.Advancing_natual_environment) return 'Environment';
  if (purposes.Preventing_or_relieving_suffering_of_animals) return 'Animals';
  if (purposes.Promoting_or_protecting_human_rights) return 'Human Rights';
  if (purposes.Advancing_social_or_public_welfare) return 'Social Welfare';
  
  return 'General Charitable Purposes';
}

async function getProcessingState(supabase: any): Promise<{ offset: number }> {
  try {
    const { data, error } = await supabase
      .from('organization_cache')
      .select('description')
      .eq('platform', 'acnc')
      .eq('external_id', '_acnc_progress_tracker')
      .single();
      
    if (error) {
      console.log('No existing ACNC progress tracker found, starting from beginning:', error);
      return { offset: 0 };
    }
    
    if (data) {
      try {
        const progress = JSON.parse(data.description || '{}');
        return {
          offset: progress.offset || 0
        };
      } catch (parseError) {
        console.error('Error parsing ACNC progress data:', parseError);
        return { offset: 0 };
      }
    }
    
    return { offset: 0 };
  } catch (error) {
    console.error('Error getting ACNC processing state:', error);
    return { offset: 0 };
  }
}

async function saveProcessingState(offset: number, supabase: any, stats?: any): Promise<void> {
  try {
    const progressData = {
      offset,
      lastRun: new Date().toISOString(),
      ...stats
    };
    
    const { error } = await supabase.from('organization_cache').upsert({
      platform: 'acnc',
      external_id: '_acnc_progress_tracker',
      name: 'ACNC Processing Progress Tracker',
      description: JSON.stringify(progressData),
      last_updated: new Date().toISOString(),
      is_active: true,
      slug: 'acnc-progress-tracker'
    }, {
      onConflict: 'platform,slug'
    });
    
    if (error) {
      console.error('Error saving ACNC processing state:', error);
    } else {
      console.log('ACNC processing state saved successfully');
    }
  } catch (error) {
    console.error('Exception while saving ACNC processing state:', error);
  }
}

async function logExecution(
  supabase: any, 
  status: string, 
  batchSize: number, 
  offset: number, 
  processed: number = 0, 
  errors: number = 0, 
  responseData: any = null, 
  errorMessage: string | null = null,
  startTime: number | null = null
): Promise<void> {
  try {
    const duration = startTime ? Date.now() - startTime : null;
    
    await supabase.from('acnc_cron_logs').insert({
      status,
      batch_size: batchSize,
      offset_value: offset,
      processed_count: processed,
      error_count: errors,
      response_data: responseData,
      error_message: errorMessage,
      duration_ms: duration
    });
  } catch (error) {
    console.error('Failed to log execution:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let supabase: any;
  let batchSize = 100;
  let offset = 0;

  try {
    supabase = createSupabaseClient();
    
    // Parse request parameters or get from state
    const url = new URL(req.url);
    batchSize = parseInt(url.searchParams.get('batch_size') || '100');
    
    // Get current processing state (ignore URL offset, use saved state)
    const state = await getProcessingState(supabase);
    offset = state.offset;

    console.log(`Starting ACNC cache population: batch_size=${batchSize}, offset=${offset} (from saved state)`);
    
    // Log start of execution
    await logExecution(supabase, 'started', batchSize, offset, 0, 0, 
      { source: 'edge_function', parameters: { batch_size: batchSize, offset } }, null, startTime);

    // Fetch ACNC charities from imported table
    const { data: acncCharities, error: fetchError } = await supabase
      .from('ACNC_Registered_Charities')
      .select('*')
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch ACNC charities: ${fetchError.message}`);
    }

    if (!acncCharities || acncCharities.length === 0) {
      await logExecution(supabase, 'completed', batchSize, offset, 0, 0, 
        { message: 'No more charities to process' }, null, startTime);
      
      // Reset offset to 0 for next cycle
      await saveProcessingState(0, supabase, { 
        message: 'All ACNC charities processed, resetting to start',
        totalProcessed: 0 
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No more ACNC charities to process, reset to beginning',
          processed: 0,
          offset,
          batch_size: batchSize,
          next_offset: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${acncCharities.length} ACNC charities`);

    // Process charities in batches for better performance
    const processedData = [];
    const errors: string[] = [];

    for (const charity of acncCharities) {
      try {
        const purposes = extractPurposes(charity);
        const beneficiaries = extractBeneficiaries(charity);
        
        const organizationData = {
          platform: 'acnc',
          external_id: charity.ABN,
          name: charity.Charity_Legal_Name || `ACNC Charity ${charity.ABN}`,
          description: charity.Other_Organisation_Names || null,
          category: determineCategory(purposes),
          slug: createSlug(charity.Charity_Legal_Name || `charity-${charity.ABN}`, charity.ABN),
          
          // Address information
          address_line1: charity.Address_Line_1,
          address_line2: charity.Address_Line_2,
          address_city: charity.Town_City,
          address_county: charity.State,
          address_country: charity.Country || 'Australia',
          address_postcode: charity.Postcode,
          website_url: charity.Charity_Website,
          
          // ACNC specific fields
          acnc_abn: charity.ABN,
          acnc_charity_legal_name: charity.Charity_Legal_Name,
          acnc_other_organisation_names: charity.Other_Organisation_Names,
          acnc_address_type: charity.Address_Type,
          acnc_registration_date: charity.Registration_Date,
          acnc_date_organisation_established: charity.Date_Organisation_Established,
          acnc_charity_size: charity.Charity_Size,
          acnc_number_of_responsible_persons: charity.Number_of_Responsible_Persons,
          acnc_financial_year_end: charity.Financial_Year_End,
          acnc_operates_in_act: charity.Operates_in_ACT,
          acnc_operates_in_nsw: charity.Operates_in_NSW,
          acnc_operates_in_nt: charity.Operates_in_NT,
          acnc_operates_in_qld: charity.Operates_in_QLD,
          acnc_operates_in_sa: charity.Operates_in_SA,
          acnc_operates_in_tas: charity.Operates_in_TAS,
          acnc_operates_in_vic: charity.Operates_in_VIC,
          acnc_operates_in_wa: charity.Operates_in_WA,
          acnc_operating_countries: charity.Operating_Countries,
          acnc_pbi: charity.PBI,
          acnc_hpc: charity.HPC,
          acnc_purposes: purposes,
          acnc_beneficiaries: beneficiaries,
          
          // Platform management
          is_active: true,
          is_featured: false,
          country_code: 'AU',
          currency_code: 'AUD',
          last_updated: new Date().toISOString(),
        };

        processedData.push(organizationData);
      } catch (error) {
        console.error(`Error processing charity ${charity.ABN}:`, error);
        errors.push(`${charity.ABN}: ${error.message}`);
      }
    }

    // Batch upsert for better performance
    let successCount = 0;
    if (processedData.length > 0) {
      const { data, error: upsertError } = await supabase
        .from('organization_cache')
        .upsert(processedData, {
          onConflict: 'platform,external_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        throw new Error(`Batch upsert failed: ${upsertError.message}`);
      }

      successCount = processedData.length;
    }

    const nextOffset = offset + batchSize;
    
    const result = {
      success: true,
      message: `Successfully processed ${successCount} ACNC charities`,
      processed: successCount,
      errors: errors.length,
      batch_size: batchSize,
      offset: offset,
      next_offset: nextOffset,
      sample_errors: errors.slice(0, 3),
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    };

    // Save next offset for next run
    await saveProcessingState(nextOffset, supabase, {
      processed: successCount,
      errors: errors.length,
      totalProcessedThisRun: successCount
    });

    // Log successful completion
    await logExecution(supabase, 'completed', batchSize, offset, successCount, errors.length, 
      { result, sample_errors: errors.slice(0, 3) }, null, startTime);

    console.log('ACNC cache population completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ACNC cache population:', error);
    
    // Log error
    if (supabase) {
      await logExecution(supabase, 'error', batchSize, offset, 0, 1, 
        null, error.message, startTime);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        batch_size: batchSize,
        offset: offset
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});