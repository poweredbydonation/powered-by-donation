/**
 * Check Users Table Schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking users table schema...\n');
  
  try {
    // Query a user to see what columns are available
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    if (users && users.length > 0) {
      const user = users[0];
      console.log('📋 Current users table columns:');
      
      Object.keys(user).sort().forEach(column => {
        const value = user[column];
        const type = typeof value;
        console.log(`  - ${column} (${type}): ${value === null ? 'null' : typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
      });

      // Check specifically for role and terms columns
      const roleColumns = Object.keys(user).filter(col => 
        col.includes('is_') || col.includes('terms_accepted')
      );

      console.log('\n🎯 Role and Terms columns:');
      if (roleColumns.length > 0) {
        roleColumns.forEach(col => {
          console.log(`  ✅ ${col}: ${user[col]}`);
        });
      } else {
        console.log('  ❌ No role or terms columns found');
      }

    } else {
      console.log('📭 No users found to analyze schema');
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

checkSchema();