/**
 * Test Market Data Extraction
 * This script tests the market data extraction logic locally to debug API response handling
 */

const axios = require('axios');

// Polymarket API Configuration
const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";
const POLYMARKET_CLOB_API = "https://clob.polymarket.com";

// Test market ID from your log
const TEST_MARKET_ID = "0x01d306ff2b8ec4b21dd39e6bd6b8e82bd1b5d63b1dc5b6f8c0b78fdfe790ca95";

/**
 * Test CLOB API data extraction
 */
async function testCLOBAPI() {
    console.log("=== Testing CLOB API ===");
    
    try {
        const response = await axios.get(`${POLYMARKET_CLOB_API}/markets`, {
            params: {
                condition_id: TEST_MARKET_ID
            }
        });

        const markets = response.data?.data || [];
        if (markets.length === 0) {
            console.log("No markets found");
            return;
        }

        const market = markets[0];
        console.log("Market found:", market.question);
        console.log("Market data keys:", Object.keys(market));
        
        // Check for price fields
        console.log("Price fields:");
        console.log("  last_trade_price:", market.last_trade_price);
        console.log("  outcome_prices:", market.outcome_prices);
        if (market.tokens && market.tokens[0]) {
            console.log("  token price:", market.tokens[0].price);
        }
        
        // Check for volume fields
        console.log("Volume fields:");
        console.log("  volume:", market.volume);
        console.log("  volume24hr:", market.volume24hr);
        
        // Test orderbook if we have tokens
        if (market.tokens && market.tokens.length > 0) {
            const token = market.tokens[0];
            console.log(`\nTesting orderbook for token: ${token.token_id}`);
            
            try {
                const orderbookResponse = await axios.get(`${POLYMARKET_CLOB_API}/book`, {
                    params: {
                        token_id: token.token_id
                    }
                });
                
                const orderbook = orderbookResponse.data;
                console.log("Orderbook structure:");
                console.log("  bids:", orderbook.bids?.length || 0, "orders");
                console.log("  asks:", orderbook.asks?.length || 0, "orders");
                
                if (orderbook.bids && orderbook.bids.length > 0) {
                    console.log("  best bid:", orderbook.bids[0]);
                }
                if (orderbook.asks && orderbook.asks.length > 0) {
                    console.log("  best ask:", orderbook.asks[0]);
                }
                
            } catch (orderbookError) {
                console.log("Orderbook error:", orderbookError.message);
            }
        }
        
    } catch (error) {
        console.log("CLOB API error:", error.message);
    }
}

/**
 * Test Gamma API search
 */
async function testGammaAPI() {
    console.log("\n=== Testing Gamma API Event Search ===");
    
    try {
        // Search through events to find the condition_id
        let page = 0;
        const limit = 20;
        let found = false;
        
        while (page < 3 && !found) {
            console.log(`Checking page ${page}...`);
            
            const response = await axios.get(`${POLYMARKET_GAMMA_API}/events`, {
                params: {
                    limit: limit,
                    offset: page * limit
                }
            });
            
            const events = response.data || [];
            console.log(`Got ${events.length} events`);
            
            for (const event of events) {
                if (event.markets) {
                    for (const market of event.markets) {
                        if (market.condition_id === TEST_MARKET_ID) {
                            console.log(`✓ Found matching event: ${event.title}`);
                            console.log(`  Market ID: ${market.id}`);
                            console.log(`  Question: ${market.question}`);
                            found = true;
                            
                            // Now test fetching this market directly
                            await testGammaMarket(market.id);
                            return;
                        }
                    }
                }
            }
            page++;
        }
        
        if (!found) {
            console.log("❌ Could not find matching event in Gamma API");
        }
        
    } catch (error) {
        console.log("Gamma events API error:", error.message);
    }
}

/**
 * Test specific Gamma market
 */
async function testGammaMarket(marketId) {
    console.log(`\n=== Testing Gamma Market ${marketId} ===`);
    
    try {
        const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets/${marketId}`);
        const market = response.data;
        
        console.log("Market data keys:", Object.keys(market));
        
        // Check price fields
        console.log("Price fields:");
        console.log("  last_trade_price:", market.last_trade_price);
        console.log("  outcome_prices:", market.outcome_prices);
        if (market.tokens && market.tokens[0]) {
            console.log("  token price:", market.tokens[0].price);
        }
        
        // Check volume fields
        console.log("Volume fields:");
        console.log("  volume:", market.volume);
        console.log("  volume24hr:", market.volume24hr);
        
    } catch (error) {
        console.log("Gamma market API error:", error.message);
    }
}

/**
 * Test fallback markets
 */
async function testFallbackMarkets() {
    console.log("\n=== Testing Fallback Markets ===");
    
    try {
        const response = await axios.get(`${POLYMARKET_CLOB_API}/markets`, {
            params: {
                active: true,
                limit: 5
            }
        });
        
        const markets = response.data?.data || [];
        console.log(`Found ${markets.length} active markets`);
        
        for (let i = 0; i < Math.min(3, markets.length); i++) {
            const market = markets[i];
            console.log(`\nMarket ${i + 1}: ${market.question}`);
            console.log("  last_trade_price:", market.last_trade_price);
            console.log("  volume:", market.volume);
            console.log("  outcome_prices:", market.outcome_prices);
        }
        
    } catch (error) {
        console.log("Fallback markets error:", error.message);
    }
}

/**
 * Main test function
 */
async function main() {
    console.log("Testing Market Data Extraction Logic");
    console.log("=====================================");
    
    await testCLOBAPI();
    await testGammaAPI();
    await testFallbackMarkets();
    
    console.log("\n✅ Test completed");
}

// Run the test
main().catch(console.error); 