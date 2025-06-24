/**
 * Test script to verify Polymarket API integration
 * Tests the corrected API endpoints and data fetching logic
 */

const axios = require('axios');

// Market data sources configuration with correct Polymarket URLs
const dataSources = {
  polymarket: {
    // Gamma API for market metadata and general market data
    gammaBaseUrl: "https://gamma-api.polymarket.com",
    // CLOB API for pricing and trading data
    clobBaseUrl: "https://clob.polymarket.com",
    headers: { 
      "Content-Type": "application/json",
      "User-Agent": "Chainlink-Functions-Client"
    }
  }
};

/**
 * Test Gamma API - Get Markets
 */
async function testGammaAPI() {
  console.log("🧪 Testing Polymarket Gamma API...");
  
  try {
    const response = await axios.get(`${dataSources.polymarket.gammaBaseUrl}/markets?limit=5&active=true`, {
      headers: dataSources.polymarket.headers
    });
    
    console.log("✅ Gamma API Status:", response.status);
    console.log("📊 Number of markets returned:", response.data.length);
    
    if (response.data.length > 0) {
      const market = response.data[0];
      console.log("📋 Sample Market Data:");
      console.log("   - ID:", market.condition_id);
      console.log("   - Question:", market.question);
      console.log("   - Category:", market.category);
      console.log("   - Active:", market.active);
      console.log("   - Tokens:", market.tokens?.length || 0);
      
      if (market.tokens && market.tokens.length > 0) {
        console.log("   - Token ID:", market.tokens[0].token_id);
        console.log("   - Outcome:", market.tokens[0].outcome);
        
        // Test CLOB API with this token
        await testCLOBAPI(market.tokens[0].token_id);
      }
    }
    
    return response.data[0]; // Return first market for further testing
    
  } catch (error) {
    console.error("❌ Gamma API Error:", error.response?.status, error.response?.statusText);
    console.error("   Message:", error.message);
    return null;
  }
}

/**
 * Test CLOB API - Get Price
 */
async function testCLOBAPI(tokenId) {
  console.log("\n🧪 Testing Polymarket CLOB API...");
  
  try {
    // Test getting buy price
    const buyResponse = await axios.get(`${dataSources.polymarket.clobBaseUrl}/price`, {
      params: {
        token_id: tokenId,
        side: 'buy'
      },
      headers: dataSources.polymarket.headers
    });
    
    console.log("✅ CLOB API Status:", buyResponse.status);
    console.log("💰 Buy Price:", buyResponse.data.price);
    
    // Test getting sell price
    const sellResponse = await axios.get(`${dataSources.polymarket.clobBaseUrl}/price`, {
      params: {
        token_id: tokenId,
        side: 'sell'
      },
      headers: dataSources.polymarket.headers
    });
    
    console.log("💰 Sell Price:", sellResponse.data.price);
    
    // Calculate spread
    const buyPrice = parseFloat(buyResponse.data.price);
    const sellPrice = parseFloat(sellResponse.data.price);
    const spread = Math.abs(buyPrice - sellPrice);
    console.log("📊 Spread:", spread.toFixed(4));
    
  } catch (error) {
    console.error("❌ CLOB API Error:", error.response?.status, error.response?.statusText);
    console.error("   Message:", error.message);
  }
}

/**
 * Test market data fetching logic (similar to Chainlink Functions script)
 */
async function testMarketDataFetching(marketId) {
  console.log("\n🧪 Testing Market Data Fetching Logic...");
  
  try {
    // Try to get specific market by condition_id from Gamma API
    let marketResponse;
    
    try {
      marketResponse = await axios.get(`${dataSources.polymarket.gammaBaseUrl}/markets`, {
        params: { condition_ids: marketId },
        headers: dataSources.polymarket.headers
      });
    } catch (error) {
      // If that fails, try to search for active markets
      marketResponse = await axios.get(`${dataSources.polymarket.gammaBaseUrl}/markets`, {
        params: { limit: 1, active: true },
        headers: dataSources.polymarket.headers
      });
    }
    
    if (marketResponse.status !== 200) {
      throw new Error(`Polymarket Gamma API error: Status ${marketResponse.status}`);
    }
    
    const marketsData = marketResponse.data;
    if (!marketsData || marketsData.length === 0) {
      throw new Error("No market data found for the provided market ID");
    }
    
    const marketData = marketsData[0]; // Get first market
    
    // Get pricing data from CLOB API if market has tokens
    let priceData = { price: 0.5, volume: 0 }; // Default values
    
    if (marketData.tokens && marketData.tokens.length > 0) {
      try {
        // Get price for the first token (YES token typically)
        const tokenId = marketData.tokens[0].token_id;
        
        // Get current price from CLOB API
        const priceResponse = await axios.get(`${dataSources.polymarket.clobBaseUrl}/price`, {
          params: {
            token_id: tokenId,
            side: 'buy'
          },
          headers: dataSources.polymarket.headers
        });
        
        if (priceResponse.status === 200 && priceResponse.data.price) {
          priceData.price = parseFloat(priceResponse.data.price);
        }
        
        // Try to get volume data from market metadata
        if (marketData.volume) {
          priceData.volume = parseFloat(marketData.volume) || 0;
        }
        
      } catch (priceError) {
        console.log(`Price fetch failed: ${priceError.message}`);
        // Use default price if pricing fails
      }
    }
    
    const result = {
      source: "polymarket",
      marketId: marketData.condition_id || marketId,
      question: marketData.question || "Unknown Question",
      price: priceData.price,
      volume: priceData.volume,
      liquidity: parseFloat(marketData.liquidity || 0),
      lastUpdate: Math.floor(Date.now() / 1000),
      active: marketData.active !== false,
      endDate: marketData.end_date_iso ? new Date(marketData.end_date_iso).getTime() / 1000 : 0,
      outcomes: marketData.tokens ? marketData.tokens.map(t => t.outcome) : ["Yes", "No"],
      metadata: {
        category: marketData.category || "unknown",
        slug: marketData.market_slug || marketData.slug,
        description: marketData.description || marketData.question,
        icon: marketData.icon,
        minOrderSize: marketData.minimum_order_size,
        closed: marketData.closed || false
      }
    };
    
    console.log("✅ Market Data Fetching Successful!");
    console.log("📋 Processed Market Data:");
    console.log(JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error("❌ Market Data Fetching Error:", error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("🚀 Starting Polymarket API Integration Tests\n");
  
  // Test 1: Gamma API
  const sampleMarket = await testGammaAPI();
  
  if (sampleMarket) {
    // Test 2: Market Data Fetching Logic
    await testMarketDataFetching(sampleMarket.condition_id);
  }
  
  console.log("\n✨ Tests completed!");
  console.log("\n📚 API Documentation:");
  console.log("   - Gamma API: https://docs.polymarket.com/developers/gamma-markets-api/overview");
  console.log("   - CLOB API: https://docs.polymarket.com/developers/CLOB/introduction");
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGammaAPI,
  testCLOBAPI,
  testMarketDataFetching,
  runTests
}; 