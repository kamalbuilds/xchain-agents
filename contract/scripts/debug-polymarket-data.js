/**
 * Debug Polymarket Data Structure
 * This script examines the actual structure of Polymarket market data
 */

const axios = require('axios');

const POLYMARKET_CLOB_API = "https://clob.polymarket.com";

async function debugMarketData() {
    console.log("=== Debugging Polymarket Market Data Structure ===");
    
    try {
        // Get first few markets to examine structure
        const response = await axios.get(`${POLYMARKET_CLOB_API}/markets`, {
            params: {
                limit: 5
            }
        });

        console.log(`Found ${response.data?.data?.length || 0} markets`);
        
        if (!response.data?.data?.length) {
            console.log("No markets found");
            return;
        }

        // Examine first 3 markets in detail
        for (let i = 0; i < Math.min(3, response.data.data.length); i++) {
            const market = response.data.data[i];
            
            console.log(`\n=== Market ${i + 1} ===`);
            console.log(`Question: ${market.question}`);
            console.log(`Active: ${market.active}`);
            console.log(`Closed: ${market.closed}`);
            console.log(`Category: ${market.category}`);
            console.log(`End Date: ${market.end_date_iso}`);
            console.log(`Condition ID: ${market.condition_id}`);
            
            if (market.tokens && market.tokens.length > 0) {
                console.log(`Tokens (${market.tokens.length}):`);
                market.tokens.forEach((token, idx) => {
                    console.log(`  Token ${idx + 1}: ${token.outcome} (ID: ${token.token_id})`);
                });
                
                // Try to get orderbook for first token
                const token = market.tokens[0];
                console.log(`\nTesting orderbook for token: ${token.outcome}`);
                
                try {
                    const bookResponse = await axios.get(`${POLYMARKET_CLOB_API}/book`, {
                        params: {
                            token_id: token.token_id
                        }
                    });

                    const book = bookResponse.data;
                    console.log(`✅ Orderbook exists!`);
                    console.log(`   Bids: ${book.bids?.length || 0}`);
                    console.log(`   Asks: ${book.asks?.length || 0}`);
                    
                    if (book.bids && book.bids.length > 0) {
                        console.log(`   Best bid: ${book.bids[0].price} (size: ${book.bids[0].size})`);
                    }
                    if (book.asks && book.asks.length > 0) {
                        console.log(`   Best ask: ${book.asks[0].price} (size: ${book.asks[0].size})`);
                    }
                    
                    // This market has orderbook data - let's use it!
                    if ((book.bids && book.bids.length > 0) || (book.asks && book.asks.length > 0)) {
                        console.log(`\n🎯 FOUND MARKET WITH ORDERBOOK DATA!`);
                        return {
                            conditionId: market.condition_id,
                            question: market.question,
                            active: market.active,
                            closed: market.closed,
                            hasOrderbook: true,
                            book: book
                        };
                    }
                    
                } catch (bookError) {
                    if (bookError.response?.status === 404) {
                        console.log(`❌ No orderbook (404)`);
                    } else {
                        console.log(`❌ Orderbook error: ${bookError.message}`);
                    }
                }
            } else {
                console.log(`No tokens found`);
            }
            
            console.log(`\n${'='.repeat(50)}`);
            
            // Add delay
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return null;
        
    } catch (error) {
        console.log("Error debugging market data:", error.message);
        return null;
    }
}

async function testGammaAPI() {
    console.log("\n=== Testing Gamma API ===");
    
    try {
        const response = await axios.get(`https://gamma-api.polymarket.com/markets`, {
            params: {
                limit: 3
            }
        });

        console.log(`Found ${response.data?.length || 0} markets in Gamma API`);
        
        if (response.data && response.data.length > 0) {
            const market = response.data[0];
            console.log(`\nSample Gamma Market:`);
            console.log(`Question: ${market.question}`);
            console.log(`Active: ${market.active}`);
            console.log(`Closed: ${market.closed}`);
            console.log(`Volume: ${market.volume}`);
            console.log(`Volume 24hr: ${market.volume24hr}`);
            console.log(`Condition ID: ${market.conditionId}`);
            console.log(`Outcome prices: ${JSON.stringify(market.outcomePrices)}`);
        }
        
    } catch (error) {
        console.log("Gamma API error:", error.message);
    }
}

async function main() {
    const result = await debugMarketData();
    await testGammaAPI();
    
    if (result && result.hasOrderbook) {
        console.log(`\n🚀 SUCCESS! Found a market with orderbook data:`);
        console.log(`   Condition ID: ${result.conditionId}`);
        console.log(`   Question: ${result.question}`);
        console.log(`   Active: ${result.active}, Closed: ${result.closed}`);
    } else {
        console.log(`\n❌ No markets with orderbook data found in first 3 markets`);
        console.log(`   This is normal - Polymarket might have limited active trading`);
        console.log(`   The Functions script should use fallback mechanisms`);
    }
}

main().catch(console.error); 