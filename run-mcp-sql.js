/**
 * Execute SQL via MCP Server Interactive Mode
 */

const { spawn } = require('child_process');

console.log('🔗 Starting MCP Server for SQL execution...\n');

const mcp = spawn('npx', [
  '-y',
  '@supabase/mcp-server-supabase@latest',
  '--project-ref=ktwlhjgomcbbjynfefys',
  '--access-token=sbp_6d23dd0cb005c26da0d831d5829c207ef9f65487'
], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let initialized = false;

mcp.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('📊 MCP Output:', output);
  
  if (!initialized && output.includes('ready')) {
    initialized = true;
    console.log('✅ MCP Server ready, sending SQL commands...\n');
    
    // Send SQL commands
    const sqlCommands = [
      'ALTER TABLE users ADD COLUMN fundraiser_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;',
      'ALTER TABLE users ADD COLUMN donor_service_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;',
      'ALTER TABLE users ADD COLUMN donor_organization_terms_accepted_time TIMESTAMPTZ DEFAULT NULL;'
    ];
    
    sqlCommands.forEach((sql, index) => {
      console.log(`📝 Sending SQL ${index + 1}: ${sql}`);
      mcp.stdin.write(sql + '\n');
    });
    
    // Close after sending commands
    setTimeout(() => {
      mcp.stdin.end();
    }, 2000);
  }
});

mcp.stderr.on('data', (data) => {
  const error = data.toString();
  console.log('⚠️  MCP Error/Info:', error);
});

mcp.on('close', (code) => {
  console.log(`\n🔚 MCP Server closed with code ${code}`);
  if (code === 0) {
    console.log('✅ SQL execution completed successfully');
  } else {
    console.log('❌ SQL execution may have failed');
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('⏰ Timeout reached, closing MCP server...');
  mcp.kill();
}, 15000);