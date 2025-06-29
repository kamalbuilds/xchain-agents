/**
 * Test Polymarket CLOB API Endpoints specifically
 * This script tests the exact API format being used in the Functions script
 */

const axios = require('axios');

const POLYMARKET_CLOB_API = "https://clob.polymarket.com";
const TEST_CONDITION_ID = "0x01d306ff2b8ec4b21dd39e6bd6b8e82bd1b5d63b1dc5b6f8c0b78fdfe790ca95";

async function testCLOBMarkets() {
    console.log("=== Testing CLOB Markets Endpoint ===");
    
    try {
        const response = await axios.get(`${POLYMARKET_CLOB_API}/markets`, {
            params: {
                condition_id: TEST_CONDITION_ID
            }
        });

        console.log("✓ Markets endpoint works");
        console.log(`Found ${response.data?.data?.length || 0} markets`);
        
        if (response.data?.data?.length > 0) {
            const market = response.data.data[0];
            console.log(`Market: ${market.question}`);
            console.log(`Tokens: ${market.tokens?.length || 0}`);
            
            if (market.tokens && market.tokens.length > 0) {
                const token = market.tokens[0];
                console.log(`Token ID: ${token.token_id}`);
                console.log(`Outcome: ${token.outcome}`);
                return token.token_id;
            }
        }
    } catch (error) {
        console.log("✗ Markets endpoint error:", error.message);
    }
    
    return null;
}

async function testPricesEndpoint(tokenId) {
    console.log("\n=== Testing Prices Endpoint (POST /prices) ===");
    
    try {
        const response = await axios.post(`${POLYMARKET_CLOB_API}/prices`, {
            params: [
                {
                    token_id: tokenId,
                    side: "BUY"
                },
                {
                    token_id: tokenId,
                    side: "SELL"
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("✓ Prices endpoint works");
        console.log("Response keys:", Object.keys(response.data));
        
        const prices = response.data[tokenId] || {};
        console.log(`BUY price: ${prices.BUY || 'N/A'}`);
        console.log(`SELL price: ${prices.SELL || 'N/A'}`);
        
    } catch (error) {
        console.log("✗ Prices endpoint error:", error.message);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
    }
}

async function testBookEndpoint(tokenId) {
    console.log("\n=== Testing Book Endpoint (GET /book) ===");
    
    try {
        const response = await axios.get(`${POLYMARKET_CLOB_API}/book`, {
            params: {
                token_id: tokenId
            }
        });

        console.log("✓ Book endpoint works");
        const book = response.data;
        console.log(`Bids: ${book.bids?.length || 0}`);
        console.log(`Asks: ${book.asks?.length || 0}`);
        
        if (book.bids && book.bids.length > 0) {
            console.log(`Best bid: ${book.bids[0].price} (size: ${book.bids[0].size})`);
        }
        if (book.asks && book.asks.length > 0) {
            console.log(`Best ask: ${book.asks[0].price} (size: ${book.asks[0].size})`);
        }
        
    } catch (error) {
        console.log("✗ Book endpoint error:", error.message);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
    }
}

async function testTradesEndpoint() {
    console.log("\n=== Testing Trades Endpoint (GET /data/trades) ===");
    
    try {
        const response = await axios.get(`${POLYMARKET_CLOB_API}/data/trades`, {
            params: {
                market: TEST_CONDITION_ID,
                limit: 10
            }
        });

        console.log("✓ Trades endpoint works");
        const trades = response.data;
        console.log(`Found ${trades.length} recent trades`);
        
        if (trades.length > 0) {
            const trade = trades[0];
            console.log(`Recent trade: price=${trade.price}, size=${trade.size}, time=${trade.match_time}`);
        }
        
    } catch (error) {
        console.log("✗ Trades endpoint error:", error.message);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
    }
}

async function main() {
    console.log("Testing Polymarket CLOB API endpoints...");
    console.log(`Condition ID: ${TEST_CONDITION_ID}\n`);
    
    // Test markets endpoint and get token ID
    const tokenId = await testCLOBMarkets();
    
    if (tokenId) {
        // Test pricing endpoints with the token ID
        await testPricesEndpoint(tokenId);
        await testBookEndpoint(tokenId);
    }
    
    // Test trades endpoint (uses condition_id)
    await testTradesEndpoint();
    
    console.log("\n=== Test Complete ===");
}

main().catch(console.error); 