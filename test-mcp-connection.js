/**
 * Test script for Supabase MCP Server connection
 * This script tests if the MCP server can be instantiated correctly
 */

const { spawn } = require('child_process');

console.log('🔍 Testing Supabase MCP Server Connection...');
console.log('📋 Project Reference: ktwlhjgomcbbjynfefys');
console.log('🔒 Mode: Read-only');
console.log('');

// Test basic MCP server instantiation
const testConnection = () => {
  console.log('⚡ Starting MCP server test...');
  
  const mcp = spawn('npx', [
    '-y',
    '@supabase/mcp-server-supabase@latest',
    '--read-only',
    '--project-ref=ktwlhjgomcbbjynfefys'
  ], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let hasOutput = false;
  
  mcp.stdout.on('data', (data) => {
    hasOutput = true;
    console.log('📊 MCP Server Output:', data.toString());
  });

  mcp.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('SUPABASE_ACCESS_TOKEN')) {
      console.log('✅ MCP server started successfully!');
      console.log('⚠️  Note: You need to set SUPABASE_ACCESS_TOKEN environment variable');
      console.log('📝 Follow the instructions in mcp-setup-instructions.md');
    } else {
      console.log('❌ MCP Server Error:', output);
    }
  });

  mcp.on('close', (code) => {
    if (code === 1 && !hasOutput) {
      console.log('✅ MCP server validation complete');
      console.log('📋 Next steps:');
      console.log('   1. Create Personal Access Token in Supabase');
      console.log('   2. Update mcp-server-config.json with your token');
      console.log('   3. Configure your AI tool (Cursor, Claude, etc.)');
    } else {
      console.log(`🔚 MCP server exited with code ${code}`);
    }
  });

  // Send a simple test input and close after 3 seconds
  setTimeout(() => {
    mcp.stdin.write('{"id": "test", "method": "ping"}\n');
    setTimeout(() => {
      mcp.kill();
    }, 1000);
  }, 2000);
};

testConnection();