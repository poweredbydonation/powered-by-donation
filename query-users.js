/**
 * Query Users Table Script
 * Fetches and displays all users in table format
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure .env.local contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryUsers() {
  console.log('🔍 Querying users table...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying users:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('📭 No users found in the database');
      return;
    }

    // Display summary
    console.log(`📊 Found ${users.length} users\n`);

    // Display as table
    console.table(users.map(user => ({
      ID: user.id.substring(0, 8) + '...',
      Email: user.email,
      Name: user.name || 'Not set',
      Username: user.username || 'Not set',
      Role: getUserRole(user),
      Platform: user.preferred_platform || 'Not set',
      Created: new Date(user.created_at).toLocaleDateString()
    })));

    // Display detailed breakdown
    console.log('\n📈 User Statistics:');
    
    const stats = {
      total: users.length,
      fundraisers: users.filter(u => u.is_fundraiser).length,
      donors: users.filter(u => u.is_donor).length,
      withName: users.filter(u => u.name).length,
      withUsername: users.filter(u => u.username).length,
      justgivingUsers: users.filter(u => u.preferred_platform === 'justgiving').length,
      everyorgUsers: users.filter(u => u.preferred_platform === 'everyorg').length,
      bothRoles: users.filter(u => u.is_fundraiser && u.is_donor).length,
    };

    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

function getUserRole(user) {
  const roles = [];
  if (user.is_fundraiser) roles.push('Fundraiser');
  if (user.is_donor) roles.push('Donor');
  return roles.length > 0 ? roles.join(', ') : 'No roles set';
}

queryUsers();