/**
 * Debug Timestamp Update Issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service key for updates

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUpdate() {
  console.log('🔍 Debugging timestamp update issue...\n');
  
  try {
    // Get a user ID
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (!users || users.length === 0) {
      throw new Error('No users found');
    }

    const testUserId = users[0].id;
    console.log(`Testing with user: ${users[0].email} (${testUserId})`);

    // Try to update with service role
    const now = new Date().toISOString();
    console.log(`Attempting to set timestamp: ${now}`);

    const { data, error } = await supabase
      .from('users')
      .update({ 
        fundraiser_service_terms_accepted_time: now 
      })
      .eq('id', testUserId)
      .select('fundraiser_service_terms_accepted_time');

    if (error) {
      console.error('❌ Update failed:', error);
    } else {
      console.log('✅ Update successful:', data);
    }

    // Verify the current value
    const { data: currentUser } = await supabase
      .from('users')
      .select('fundraiser_service_terms_accepted_time')
      .eq('id', testUserId)
      .single();

    console.log('Current timestamp value:', currentUser?.fundraiser_service_terms_accepted_time);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugUpdate();