/**
 * Demo: Complete Workflow from Polymarket URL to Market Data
 * 
 * This script demonstrates the complete process of:
 * 1. Extracting market ID from Polymarket URL
 * 2. Fetching market data using the ID
 * 3. Showing how to use this in Chainlink Functions
 */

const { extractMarketId } = require('./extract-market-id-from-url.js');
const https = require('https');

// Utility function for HTTP requests
function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Polymarket-Demo/1.0)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
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

async function demoWorkflow() {
  console.log('🎯 Polymarket URL to Market Data - Complete Demo\n');
  console.log('='.repeat(60));
  
  // Example URLs to demonstrate
  const exampleUrls = [
    "https://polymarket.com/event/new-york-city-mayoral-election",
    "nfl-saturday-chiefs-vs-raiders",
    "0x9deb0baac40648821f96f01339229a422e2f5c877de55dc4dbf981f95a1e709c"
  ];
  
  for (let i = 0; i < exampleUrls.length; i++) {
    const identifier = exampleUrls[i];
    
    console.log(`\n📍 DEMO ${i + 1}: ${identifier.length > 50 ? identifier.substring(0, 50) + '...' : identifier}`);
    console.log('-'.repeat(60));
    
    try {
      // Step 1: Extract market ID
      console.log('🔍 Step 1: Extracting market ID...');
      const result = await extractMarketId(identifier);
      
      if (result.success && result.recommended) {
        const marketInfo = result.recommended;
        console.log(`✅ Found market!`);
        console.log(`   Condition ID: ${marketInfo.condition_id}`);
        console.log(`   Question: ${marketInfo.question}`);
        console.log(`   Type: ${marketInfo.type}`);
        console.log(`   Status: ${marketInfo.active ? 'Active' : 'Inactive'} / ${marketInfo.closed ? 'Closed' : 'Open'}`);
        
        // Step 2: Fetch detailed market data
        console.log('\n📊 Step 2: Fetching detailed market data...');
        await fetchDetailedMarketData(marketInfo.condition_id);
        
        // Step 3: Show Chainlink Functions integration
        console.log('\n🔗 Step 3: Chainlink Functions integration example...');
        showChainlinkIntegration(marketInfo.condition_id);
        
      } else {
        console.log('❌ Could not extract market ID');
        console.log('   This demonstrates fallback handling');
      }
      
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
    
    if (i < exampleUrls.length - 1) {
      console.log('\n' + '='.repeat(60));
    }
  }
}

async function fetchDetailedMarketData(conditionId) {
  try {
    // Fetch from CLOB API
    const url = `https://clob.polymarket.com/markets?condition_id=${conditionId}`;
    const response = await makeHttpRequest(url);
    
    if (response.error) {
      console.log(`❌ API Error: ${response.error}`);
      return;
    }
    
    if (response.data?.data && response.data.data.length > 0) {
      const market = response.data.data[0];
      
      console.log(`✅ Market Details:`);
      console.log(`   Question: ${market.question}`);
      console.log(`   Category: ${market.category}`);
      console.log(`   Active: ${market.active}`);
      console.log(`   Closed: ${market.closed}`);
      console.log(`   End Date: ${market.end_date_iso}`);
      console.log(`   Tokens: ${market.tokens?.length || 0}`);
      
      if (market.tokens && market.tokens.length > 0) {
        console.log(`   Token Outcomes:`);
        market.tokens.forEach((token, index) => {
          console.log(`     ${index + 1}. ${token.outcome} (ID: ${token.token_id.substring(0, 10)}...)`);
        });
        
        // Try to get orderbook data for first token
        if (market.active && !market.closed) {
          console.log(`\n📈 Attempting to fetch live orderbook data...`);
          await fetchOrderbookData(market.tokens[0].token_id);
        } else {
          console.log(`\n📊 Market is inactive - no live orderbook data available`);
        }
      }
      
    } else {
      console.log(`❌ No market data found for condition ID`);
    }
    
  } catch (error) {
    console.log(`❌ Error fetching market data: ${error.message}`);
  }
}

async function fetchOrderbookData(tokenId) {
  try {
    const url = `https://clob.polymarket.com/book?token_id=${tokenId}`;
    const response = await makeHttpRequest(url);
    
    if (response.error) {
      console.log(`❌ Orderbook Error: ${response.error}`);
      return;
    }
    
    if (response.data) {
      const book = response.data;
      const bidCount = book.bids?.length || 0;
      const askCount = book.asks?.length || 0;
      
      console.log(`✅ Orderbook Data:`);
      console.log(`   Bids: ${bidCount}`);
      console.log(`   Asks: ${askCount}`);
      
      if (bidCount > 0) {
        const bestBid = book.bids[0];
        console.log(`   Best Bid: $${bestBid.price} (Size: ${bestBid.size})`);
      }
      
      if (askCount > 0) {
        const bestAsk = book.asks[0];
        console.log(`   Best Ask: $${bestAsk.price} (Size: ${bestAsk.size})`);
      }
      
      if (bidCount > 0 && askCount > 0) {
        const midPrice = (parseFloat(book.bids[0].price) + parseFloat(book.asks[0].price)) / 2;
        console.log(`   Mid Price: $${midPrice.toFixed(4)} (${(midPrice * 100).toFixed(1)}% probability)`);
      }
      
    } else {
      console.log(`❌ No orderbook data available`);
    }
    
  } catch (error) {
    console.log(`❌ Error fetching orderbook: ${error.message}`);
  }
}

function showChainlinkIntegration(conditionId) {
  console.log(`✅ Chainlink Functions Integration:`);
  console.log(`   
   // In your smart contract:
   string[] memory args = new string[](1);
   args[0] = "${conditionId}";
   
   _sendRequest(
       marketDataScript,    // JavaScript source code
       SubscriptionId,      // Chainlink subscription ID
       args,               // Arguments array with condition_id
       secrets,            // Encrypted secrets (if needed)
       gasLimit            // Gas limit for callback
   );
   
   // The marketDataFetcher.js script will:
   // 1. Accept the condition_id parameter
   // 2. Fetch data from CLOB and Gamma APIs
   // 3. Return encoded price, volume, timestamp
   // 4. Call your fulfillRequest function
   `);
}

async function showAvailableMarkets() {
  console.log('\n🎯 Finding Available Markets for Testing\n');
  console.log('='.repeat(60));
  
  try {
    const response = await makeHttpRequest('https://clob.polymarket.com/markets?limit=10');
    
    if (response.error) {
      console.log(`❌ Error: ${response.error}`);
      return;
    }
    
    if (response.data?.data) {
      console.log(`✅ Found ${response.data.data.length} available markets:\n`);
      
      response.data.data.forEach((market, index) => {
        console.log(`${index + 1}. ${market.question}`);
        console.log(`   Condition ID: ${market.condition_id}`);
        console.log(`   Slug: ${market.market_slug}`);
        console.log(`   URL: https://polymarket.com/market/${market.market_slug}`);
        console.log(`   Status: ${market.active ? 'Active' : 'Inactive'} / ${market.closed ? 'Closed' : 'Open'}`);
        console.log('');
      });
      
      console.log('💡 You can test with any of these URLs or condition IDs!');
      
    } else {
      console.log('❌ No markets data received');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--markets')) {
    await showAvailableMarkets();
  } else if (args.length > 0) {
    // Test with provided arguments
    for (const arg of args) {
      console.log(`\n🔍 Testing: ${arg}`);
      const result = await extractMarketId(arg);
      
      if (result.success) {
        console.log('✅ SUCCESS!');
        console.log(`Found ${result.results.length} result(s)`);
        
        if (result.recommended) {
          await fetchDetailedMarketData(result.recommended.condition_id);
        }
      } else {
        console.log('❌ FAILED');
      }
    }
  } else {
    await demoWorkflow();
  }
  
  console.log('\n💡 Usage Options:');
  console.log('   node demo-url-to-market-id.js                    # Run full demo');
  console.log('   node demo-url-to-market-id.js --markets          # Show available markets');
  console.log('   node demo-url-to-market-id.js "your-url-here"    # Test specific URL');
}

if (require.main === module) {
  main().catch(console.error);
} 