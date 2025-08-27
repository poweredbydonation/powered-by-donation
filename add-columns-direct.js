/**
 * Add Terms Timestamp Columns Directly
 * Use raw SQL execution via service role
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create client with service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addColumns() {
  console.log('⚡ Adding Terms Timestamp Columns...\n');
  
  const columns = [
    'fundraiser_service_terms_accepted_time',
    'donor_service_terms_accepted_time', 
    'donor_organization_terms_accepted_time'
  ];
  
  for (const column of columns) {
    try {
      console.log(`📝 Adding column: ${column}`);
      
      // Use PostgreSQL's ALTER TABLE with IF NOT EXISTS
      const sql = `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column} TIMESTAMPTZ DEFAULT NULL;`;
      
      console.log(`   SQL: ${sql}`);
      
      // Try to execute via a stored function if it exists
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
      
      if (error) {
        console.log(`   ⚠️  RPC failed: ${error.message}`);
        
        // Alternative: Try to insert a test record with the new column to see if it exists
        const testUpdate = {
          [column]: null
        };
        
        const { error: updateError } = await supabase
          .from('users')
          .update(testUpdate)
          .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID
          .select();
          
        if (updateError && updateError.message.includes('does not exist')) {
          console.log(`   ❌ Column ${column} does not exist and cannot be added via API`);
        } else if (updateError && updateError.message.includes('No rows found')) {
          console.log(`   ✅ Column ${column} already exists (update failed due to non-existent ID)`);
        } else {
          console.log(`   🔍 Column status unclear: ${updateError?.message || 'unknown'}`);
        }
      } else {
        console.log(`   ✅ Column ${column} added successfully`);
      }
      
    } catch (err) {
      console.log(`   ❌ Error with ${column}: ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Final verification - checking if columns are accessible...\n');
  
  // Try to select all columns to see which ones exist
  const testColumns = [
    'id', 'email', 'name',
    'fundraiser_service_terms_accepted_time',
    'donor_service_terms_accepted_time',
    'donor_organization_terms_accepted_time'
  ];
  
  for (const col of testColumns) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(col)
        .limit(1);
        
      if (error && error.message.includes('does not exist')) {
        console.log(`❌ ${col}: Column does not exist`);
      } else {
        console.log(`✅ ${col}: Column exists and accessible`);
      }
    } catch (err) {
      console.log(`⚠️  ${col}: Error checking - ${err.message}`);
    }
  }
}

addColumns();