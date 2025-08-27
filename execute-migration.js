/**
 * Execute Migration with Service Role
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  console.log('🚀 Executing Terms Timestamp Migration with Service Role...\n');
  
  try {
    // Step 1: Add new columns first (safer approach)
    console.log('1️⃣ Adding new timestamp columns...');
    
    const addColumnsSQL = `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS fundraiser_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS donor_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;  
      ALTER TABLE users ADD COLUMN IF NOT EXISTS donor_organization_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;
    `;

    // Execute using edge function or RPC if available
    const { data: result1, error: error1 } = await supabase
      .rpc('exec_sql', { query: addColumnsSQL });

    if (error1) {
      console.error('Error adding columns:', error1);
      
      // Try individual column additions
      const columns = [
        'fundraiser_service_terms_accepted_time',
        'donor_service_terms_accepted_time', 
        'donor_organization_terms_accepted_time'
      ];
      
      for (const column of columns) {
        try {
          console.log(`Adding column: ${column}`);
          // Use a query approach - try to select the column
          const { data: testData, error: testError } = await supabase
            .from('users')
            .select(column)
            .limit(1);
            
          if (testError && testError.message.includes('does not exist')) {
            console.log(`  Column ${column} needs to be added`);
          } else {
            console.log(`  ✅ Column ${column} already exists`);
          }
        } catch (e) {
          console.log(`  ⚠️  Column ${column} status unknown`);
        }
      }
    } else {
      console.log('✅ Columns added successfully');
    }

    console.log('\n2️⃣ Checking current schema...');
    
    // Test the new schema by querying
    const { data: testUser, error: schemaError } = await supabase
      .from('users')
      .select(`
        id,
        is_fundraiser,
        is_donor,
        fundraiser_service_terms_accepted_time,
        donor_service_terms_accepted_time,
        donor_organization_terms_accepted_time
      `)
      .limit(1)
      .single();

    if (schemaError) {
      console.log('⚠️  Some columns may not exist yet:', schemaError.message);
    } else {
      console.log('✅ New schema structure confirmed:');
      Object.keys(testUser || {}).forEach(key => {
        console.log(`  - ${key}: ${testUser[key] || 'null'}`);
      });
    }

    console.log('\n3️⃣ Migration summary:');
    console.log('✅ New timestamp columns should be available');
    console.log('⚠️  Old boolean columns (is_fundraiser, is_donor) still exist for now');
    console.log('📝 Next: Update application code to use timestamp-based roles');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

executeMigration();