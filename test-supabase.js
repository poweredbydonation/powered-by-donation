// Simple Supabase connection test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n');
  
  // Check if environment variables are loaded
  console.log('📋 Environment variables:');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Missing required environment variables');
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('🔌 Created Supabase client successfully');

    // Test basic connection with a simple health check
    console.log('⏰ Testing connection with health check...');
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('❌ Connection test failed:', error.message);
      console.log('💡 This might mean:');
      console.log('   - API keys are outdated/legacy format');
      console.log('   - Project URL is incorrect');
      console.log('   - Network connectivity issues');
      return;
    }

    console.log('✅ Connection successful!');
    console.log('🎉 Supabase is properly configured and accessible');
    console.log('📊 Session data structure looks good:', typeof data);

  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

testSupabaseConnection();