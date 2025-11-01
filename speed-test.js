/**
 * Speed Test for JustGiving Charities API
 * Tests both the API endpoint and full page load performance
 */

const API_BASE_URL = 'http://localhost:3000';
const TEST_ITERATIONS = 5;

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function formatTime(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

async function testApiEndpoint() {
  console.log(`${colors.blue}${colors.bold}🚀 Testing API Endpoint Performance${colors.reset}`);
  console.log(`Endpoint: /api/justgiving/organizations\n`);
  
  const results = [];
  
  for (let i = 1; i <= TEST_ITERATIONS; i++) {
    const start = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/justgiving/organizations?page=1&limit=6`);
      const end = Date.now();
      const loadTime = end - start;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const parseTime = Date.now() - end;
      const totalTime = loadTime + parseTime;
      
      results.push({
        iteration: i,
        apiTime: loadTime,
        parseTime,
        totalTime,
        organizationCount: data.organizations?.length || 0,
        totalResults: data.pagination?.total_results || 0
      });
      
      console.log(`Test ${i}: ${colors.green}${formatTime(totalTime)}${colors.reset} (API: ${formatTime(loadTime)}, Parse: ${formatTime(parseTime)}) - ${data.organizations?.length || 0} orgs`);
      
    } catch (error) {
      console.log(`Test ${i}: ${colors.red}FAILED${colors.reset} - ${error.message}`);
      results.push({
        iteration: i,
        error: error.message,
        totalTime: null
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate statistics
  const validResults = results.filter(r => r.totalTime !== null);
  
  if (validResults.length > 0) {
    const times = validResults.map(r => r.totalTime);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n${colors.bold}📊 API Performance Summary:${colors.reset}`);
    console.log(`Average: ${colors.yellow}${formatTime(avgTime)}${colors.reset}`);
    console.log(`Fastest: ${colors.green}${formatTime(minTime)}${colors.reset}`);
    console.log(`Slowest: ${colors.red}${formatTime(maxTime)}${colors.reset}`);
    console.log(`Organizations per request: ${validResults[0]?.organizationCount || 'N/A'}`);
    console.log(`Total organizations: ${validResults[0]?.totalResults || 'N/A'}`);
  }
  
  return validResults;
}

async function testPageLoad() {
  console.log(`\n${colors.blue}${colors.bold}🌐 Testing Full Page Load Performance${colors.reset}`);
  console.log(`Note: This requires the dev server to be running on localhost:3000\n`);
  
  const results = [];
  
  for (let i = 1; i <= TEST_ITERATIONS; i++) {
    const start = Date.now();
    
    try {
      // Test the full HTML page
      const response = await fetch(`${API_BASE_URL}/en/justgiving/charities`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const end = Date.now();
      const loadTime = end - start;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const parseTime = Date.now() - end;
      const totalTime = loadTime + parseTime;
      const htmlSize = (html.length / 1024).toFixed(2);
      
      results.push({
        iteration: i,
        loadTime,
        parseTime,
        totalTime,
        htmlSize: parseFloat(htmlSize)
      });
      
      console.log(`Test ${i}: ${colors.green}${formatTime(totalTime)}${colors.reset} (Load: ${formatTime(loadTime)}, Parse: ${formatTime(parseTime)}) - ${htmlSize}KB HTML`);
      
    } catch (error) {
      console.log(`Test ${i}: ${colors.red}FAILED${colors.reset} - ${error.message}`);
      results.push({
        iteration: i,
        error: error.message,
        totalTime: null
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Calculate statistics
  const validResults = results.filter(r => r.totalTime !== null);
  
  if (validResults.length > 0) {
    const times = validResults.map(r => r.totalTime);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const avgSize = validResults.reduce((a, b) => a + b.htmlSize, 0) / validResults.length;
    
    console.log(`\n${colors.bold}📊 Page Load Performance Summary:${colors.reset}`);
    console.log(`Average: ${colors.yellow}${formatTime(avgTime)}${colors.reset}`);
    console.log(`Fastest: ${colors.green}${formatTime(minTime)}${colors.reset}`);
    console.log(`Slowest: ${colors.red}${formatTime(maxTime)}${colors.reset}`);
    console.log(`Average HTML Size: ${avgSize.toFixed(2)}KB`);
  }
  
  return validResults;
}

async function runFullSpeedTest() {
  console.log(`${colors.bold}⚡ Speed Test for JustGiving Charities Page${colors.reset}`);
  console.log(`${colors.bold}====================================================${colors.reset}\n`);
  
  try {
    // Test API endpoint performance
    const apiResults = await testApiEndpoint();
    
    // Test full page load performance
    const pageResults = await testPageLoad();
    
    console.log(`\n${colors.bold}🎯 Overall Performance Assessment:${colors.reset}`);
    
    if (apiResults.length > 0 && pageResults.length > 0) {
      const avgApiTime = apiResults.reduce((a, b) => a + b.totalTime, 0) / apiResults.length;
      const avgPageTime = pageResults.reduce((a, b) => a + b.totalTime, 0) / pageResults.length;
      
      console.log(`API Response Time: ${colors.yellow}${formatTime(avgApiTime)}${colors.reset}`);
      console.log(`Full Page Load Time: ${colors.yellow}${formatTime(avgPageTime)}${colors.reset}`);
      
      // Performance ratings
      if (avgApiTime < 200) {
        console.log(`API Performance: ${colors.green}Excellent${colors.reset} 🚀`);
      } else if (avgApiTime < 500) {
        console.log(`API Performance: ${colors.yellow}Good${colors.reset} 👍`);
      } else {
        console.log(`API Performance: ${colors.red}Needs Improvement${colors.reset} ⚠️`);
      }
      
      if (avgPageTime < 1000) {
        console.log(`Page Load Performance: ${colors.green}Excellent${colors.reset} 🚀`);
      } else if (avgPageTime < 2000) {
        console.log(`Page Load Performance: ${colors.yellow}Good${colors.reset} 👍`);
      } else {
        console.log(`Page Load Performance: ${colors.red}Needs Improvement${colors.reset} ⚠️`);
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}Speed test failed:${colors.reset}`, error.message);
  }
  
  console.log(`\n${colors.bold}📝 Test Configuration:${colors.reset}`);
  console.log(`- Items per page: 6 (reduced from 12 → 10 → 6)`);
  console.log(`- API fields: Optimized selection (removed email/website)`);
  console.log(`- Test iterations: ${TEST_ITERATIONS}`);
  console.log(`- Server: http://localhost:3000`);
}

// Run the speed test
runFullSpeedTest().catch(console.error);