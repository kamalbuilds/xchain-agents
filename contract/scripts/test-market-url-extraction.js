/**
 * Test Market URL Extraction
 * Debug and test the market ID extraction functionality
 */

const https = require('https');

function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Polymarket-Test/1.0)',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            error: null
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: `JSON parse error: ${error.message}`
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        status: 0,
        data: null,
        error: error.message
      });
    });

    req.end();
  });
}

async function testMarketAPIs() {
  console.log('🧪 Testing Polymarket APIs\n');
  
  // Test 1: Gamma Markets API
  console.log('1️⃣ Testing Gamma Markets API...');
  try {
    const response = await makeHttpRequest('https://gamma-api.polymarket.com/markets?limit=5');
    
    if (response.error) {
      console.log(`❌ Error: ${response.error}`);
    } else {
      console.log(`✅ Status: ${response.status}`);
      
      if (Array.isArray(response.data)) {
        console.log(`📊 Found ${response.data.length} events`);
        
        // Show first event structure
        if (response.data.length > 0) {
          const firstEvent = response.data[0];
          console.log('\n📋 First event structure:');
          console.log(`   ID: ${firstEvent.id}`);
          console.log(`   Slug: ${firstEvent.slug}`);
          console.log(`   Title: ${firstEvent.title}`);
          console.log(`   Markets: ${firstEvent.markets ? firstEvent.markets.length : 'none'}`);
          
          if (firstEvent.markets && firstEvent.markets.length > 0) {
            const firstMarket = firstEvent.markets[0];
            console.log('\n🎯 First market structure:');
            console.log(`   Market ID: ${firstMarket.id}`);
            console.log(`   Condition ID: ${firstMarket.conditionId}`);
            console.log(`   Slug: ${firstMarket.slug}`);
            console.log(`   Question: ${firstMarket.question}`);
            console.log(`   Active: ${firstMarket.active}`);
            console.log(`   Closed: ${firstMarket.closed}`);
          }
        }
      } else {
        console.log(`❌ Unexpected data format:`, typeof response.data);
      }
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: CLOB Markets API
  console.log('2️⃣ Testing CLOB Markets API...');
  try {
    const response = await makeHttpRequest('https://clob.polymarket.com/markets?limit=5');
    
    if (response.error) {
      console.log(`❌ Error: ${response.error}`);
    } else {
      console.log(`✅ Status: ${response.status}`);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`📊 Found ${response.data.data.length} markets`);
        
        // Show first market structure
        if (response.data.data.length > 0) {
          const firstMarket = response.data.data[0];
          console.log('\n🎯 First market structure:');
          console.log(`   Condition ID: ${firstMarket.condition_id}`);
          console.log(`   Market Slug: ${firstMarket.market_slug}`);
          console.log(`   Question: ${firstMarket.question}`);
          console.log(`   Active: ${firstMarket.active}`);
          console.log(`   Closed: ${firstMarket.closed}`);
          console.log(`   Tokens: ${firstMarket.tokens ? firstMarket.tokens.length : 'none'}`);
        }
      } else {
        console.log(`❌ Unexpected data format:`, typeof response.data);
        console.log('Raw data sample:', JSON.stringify(response.data).substring(0, 200));
      }
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Find a real working example
  console.log('3️⃣ Finding working examples...');
  try {
    const response = await makeHttpRequest('https://gamma-api.polymarket.com/markets?limit=20');
    
    if (!response.error && Array.isArray(response.data)) {
      console.log(`📊 Searching through ${response.data.length} events for working examples...`);
      
      let foundExamples = 0;
      
      for (const event of response.data) {
        if (event.markets && event.markets.length > 0) {
          for (const market of event.markets) {
            if (market.conditionId && market.slug) {
              foundExamples++;
              console.log(`\n✅ Working Example ${foundExamples}:`);
              console.log(`   Event Slug: ${event.slug}`);
              console.log(`   Market Slug: ${market.slug}`);
              console.log(`   Condition ID: ${market.conditionId}`);
              console.log(`   Question: ${market.question}`);
              console.log(`   URL: https://polymarket.com/market/${market.slug}`);
              
              if (foundExamples >= 3) break;
            }
          }
          if (foundExamples >= 3) break;
        }
      }
      
      if (foundExamples === 0) {
        console.log('❌ No working examples found with proper structure');
      }
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

async function testSpecificMarket(identifier) {
  console.log(`\n🔍 Testing specific market: ${identifier}\n`);
  
  // Import our extraction module
  const { extractMarketId } = require('./extract-market-id-from-url.js');
  
  try {
    const result = await extractMarketId(identifier);
    
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log(`Found ${result.results.length} result(s)`);
      
      result.results.forEach((market, index) => {
        console.log(`\n--- Result ${index + 1} ---`);
        console.log(`Type: ${market.type}`);
        console.log(`Condition ID: ${market.condition_id}`);
        console.log(`Question: ${market.question}`);
        if (market.event_title) console.log(`Event: ${market.event_title}`);
        if (market.market_slug) console.log(`Slug: ${market.market_slug}`);
      });
    } else {
      console.log('❌ FAILED');
      console.log(`Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    await testMarketAPIs();
    
    // Test with examples if provided
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
      for (const arg of args) {
        await testSpecificMarket(arg);
      }
    } else {
      console.log('\n💡 Usage: node test-market-url-extraction.js "<URL_OR_SLUG>"');
      console.log('Example: node test-market-url-extraction.js "https://polymarket.com/market/some-market"');
    }
    
  } catch (error) {
    console.log(`💥 Fatal error: ${error.message}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testMarketAPIs, testSpecificMarket }; 